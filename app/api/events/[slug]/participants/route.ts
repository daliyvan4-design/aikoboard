import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { participantSchema, checkDataUriImage } from "@/lib/validation";
import { uploadBase64Image } from "@/lib/cloudinary";
import { expectedParticipantAmount, defaultParticipantType } from "@/lib/pricing";
import { assertEventAccess } from "@/lib/event-access";
import { log } from "@/lib/logger";

/** Statuts qui occupent une place dans la jauge de capacité. */
const OCCUPYING_STATUSES = ["confirme", "pending"];

const MAX_TICKET_ATTEMPTS = 5;

function genRef() {
  return `AIKO-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function formatDateRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  return `${start.toLocaleDateString("fr-FR", { day: "numeric" })} - ${end.toLocaleDateString("fr-FR", opts)}`;
}

class CapacityError extends Error {}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const blocked = await rateLimit(req, "participants", 5, "60 s");
    if (blocked) return blocked;

    const { slug } = await params;
    const event = await prisma.event.findUnique({ where: { slug } });

    if (!event) {
      return NextResponse.json({ error: "Evenement introuvable" }, { status: 404 });
    }

    // Un événement non payé (ou suspendu) n'accepte pas d'inscription.
    if (event.statut !== "actif") {
      return NextResponse.json(
        { error: "Les inscriptions ne sont pas ouvertes pour cet evenement" },
        { status: 403 },
      );
    }

    const raw = await req.json();
    const { photo, ...rest } = raw;
    const parsed = participantSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const body = parsed.data;

    const type = body.type ?? defaultParticipantType(event.type);
    // Le montant et le statut viennent du tarif de l'événement, jamais du client.
    const montant = expectedParticipantAmount(event, type);
    const statut = montant > 0 ? "pending" : "confirme";

    // Photo : mêmes règles que /api/upload (type MIME + taille réelle).
    let photoUrl = body.photoUrl;
    if (!photoUrl && photo !== undefined && photo !== null && photo !== "") {
      const check = checkDataUriImage(photo);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
      try {
        const uploaded = await uploadBase64Image(photo as string, "badges");
        photoUrl = uploaded.url;
      } catch (err) {
        log.warn("Upload photo participant echoue", { slug }, err);
      }
    }

    // Capacité + numéro de ticket dans une seule transaction : deux
    // inscriptions simultanées ne peuvent plus dépasser la jauge ni
    // recevoir le même numéro. La contrainte unique (eventId, ticketNumber)
    // sert de filet — en cas de collision on retente.
    let participant: { reference: string; ticketNumber: number; type: string } | null = null;

    for (let attempt = 0; attempt < MAX_TICKET_ATTEMPTS; attempt++) {
      try {
        participant = await prisma.$transaction(async (tx) => {
          const taken = await tx.participant.count({
            where: { eventId: event.id, statut: { in: OCCUPYING_STATUSES } },
          });
          if (taken >= event.capacite) {
            throw new CapacityError();
          }

          const last = await tx.participant.aggregate({
            where: { eventId: event.id },
            _max: { ticketNumber: true },
          });

          return tx.participant.create({
            data: {
              eventId: event.id,
              reference: genRef(),
              ticketNumber: (last._max.ticketNumber ?? 0) + 1,
              prenom: body.prenom,
              nom: body.nom,
              email: body.email,
              telephone: body.telephone,
              organisation: body.organisation,
              titre: body.titre,
              photoUrl,
              type,
              statut,
              montant,
              residenceTarifId: body.residenceTarifId ?? null,
            },
            select: { reference: true, ticketNumber: true, type: true },
          });
        });
        break;
      } catch (err) {
        if (err instanceof CapacityError) {
          return NextResponse.json(
            { error: "Evenement complet", code: "EVENT_FULL" },
            { status: 409 },
          );
        }
        const isCollision =
          err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        if (!isCollision || attempt === MAX_TICKET_ATTEMPTS - 1) throw err;
      }
    }

    if (!participant) {
      return NextResponse.json({ error: "Erreur inscription" }, { status: 500 });
    }

    if (statut === "confirme" && body.email) {
      sendConfirmationEmail({
        to: body.email,
        participantName: `${body.prenom} ${body.nom}`,
        eventName: event.nom,
        eventDate: formatDateRange(event.dateDebut, event.dateFin),
        eventLieu: `${event.lieu} · ${event.ville}`,
        reference: participant.reference,
        ticketNumber: participant.ticketNumber,
        type: participant.type as "badge" | "ticket",
        amount: montant,
      }).catch(() => {});
    }

    sendAdminNotificationEmail({
      type: "new_registration",
      eventName: event.nom,
      participantName: `${body.prenom} ${body.nom}`,
      reference: participant.reference,
      amount: montant,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: {
        reference: participant.reference,
        ticketNumber: participant.ticketNumber,
        type: participant.type,
        montant,
        statut,
      },
    });
  } catch (err) {
    log.error("Inscription impossible", { route: "POST /api/events/[slug]/participants" }, err);
    return NextResponse.json({ error: "Erreur inscription" }, { status: 500 });
  }
}

/**
 * Liste des inscrits : réservée à l'équipe AIKO (session admin) ou à
 * l'organisateur muni du token de gestion de son événement.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const blocked = await rateLimit(req, "participants-list", 30, "60 s");
    if (blocked) return blocked;

    const access = await assertEventAccess(req, slug);
    if (access.error) return access.error;

    const participants = await prisma.participant.findMany({
      where: { eventId: access.event.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: participants });
  } catch (err) {
    log.error("Liste participants impossible", { route: "GET /api/events/[slug]/participants" }, err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
