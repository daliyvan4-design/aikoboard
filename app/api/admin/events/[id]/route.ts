import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";
import { slugify, uniqueSlug } from "@/lib/slug";
import { log } from "@/lib/logger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.statut !== undefined) data.statut = body.statut;
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.type !== undefined) data.type = body.type;
  if (body.description !== undefined) data.description = body.description;
  if (body.organisateur !== undefined) data.organisateur = body.organisateur;
  if (body.lieu !== undefined) data.lieu = body.lieu;
  if (body.ville !== undefined) data.ville = body.ville;
  if (body.dateDebut !== undefined) data.dateDebut = new Date(body.dateDebut);
  if (body.dateFin !== undefined) data.dateFin = new Date(body.dateFin);
  if (body.capacite !== undefined) data.capacite = parseInt(body.capacite) || 500;
  if (body.contactEmail !== undefined) data.contactEmail = body.contactEmail;
  if (body.contactTel !== undefined) data.contactTel = body.contactTel;
  if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl || null;
  if (body.coverUrl !== undefined) data.coverUrl = body.coverUrl || null;

  // L'adresse suit le nom : renommer l'evenement change son slug, et
  // l'ancien devient un alias pour ne casser aucun lien deja partage.
  if (typeof body.nom === "string" && body.nom.trim()) {
    const current = await prisma.event.findUnique({
      where: { id },
      select: { slug: true, nom: true, slugAliases: true },
    });

    if (current && current.nom !== body.nom) {
      const wanted = await uniqueSlug(slugify(body.nom), id);
      if (wanted !== current.slug) {
        data.slug = wanted;
        data.slugAliases = Array.from(new Set([...current.slugAliases, current.slug]));
        log.info("Slug d'evenement mis a jour", {
          action: "rename",
          slug: wanted,
          previous: current.slug,
        });
      }
    }
  }

  const event = await prisma.event.update({
    where: { id },
    data,
  });

  return NextResponse.json({ success: true, data: event });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;

  await prisma.event.update({
    where: { id },
    data: { statut: "supprime" },
  });

  return NextResponse.json({ success: true });
}
