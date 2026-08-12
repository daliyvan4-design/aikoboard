import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "./prisma";
import { requireAnyAdmin } from "./admin-auth";

/**
 * Contrôle d'accès aux données privées d'un événement (liste des inscrits,
 * coordonnées, montants).
 *
 * Deux porteurs de droits :
 *  - l'équipe AIKO, via une session admin ;
 *  - l'organisateur, via le token de gestion reçu par email à la création.
 */

export interface EventIdentity {
  id: string;
  slug: string;
  nom: string;
  statut: string;
}

export type EventAccess =
  | { error: NextResponse; event: null }
  | { error: null; event: EventIdentity; via: "admin" | "token" };

function tokenMatches(provided: string, expected: string | null): boolean {
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Lit le token de gestion depuis la query string ou l'en-tête dédié. */
export function readManageToken(req: NextRequest): string {
  return (
    req.nextUrl.searchParams.get("token") ??
    req.headers.get("x-manage-token") ??
    ""
  ).trim();
}

export async function assertEventAccess(
  req: NextRequest,
  slug: string,
): Promise<EventAccess> {
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true, slug: true, nom: true, statut: true, manageToken: true },
  });

  if (!event) {
    return {
      error: NextResponse.json({ error: "Evenement introuvable" }, { status: 404 }),
      event: null,
    };
  }

  const identity: EventIdentity = {
    id: event.id,
    slug: event.slug,
    nom: event.nom,
    statut: event.statut,
  };

  const token = readManageToken(req);
  if (token && tokenMatches(token, event.manageToken)) {
    return { error: null, event: identity, via: "token" };
  }

  const { error } = await requireAnyAdmin();
  if (!error) {
    return { error: null, event: identity, via: "admin" };
  }

  // Un token fourni mais invalide est un refus explicite, pas une invitation
  // à se connecter en admin.
  return {
    error: NextResponse.json(
      { error: token ? "Lien de gestion invalide" : "Acces refuse" },
      { status: token ? 403 : 401 },
    ),
    event: null,
  };
}
