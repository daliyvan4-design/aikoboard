import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

/** Une reference valide ressemble à AIKO-XXXXXXXX. */
const REF_PATTERN = /^[A-Za-z0-9-]{6,40}$/;

/**
 * Consultation d'une inscription par sa reference (QR code).
 *
 * La reference tient lieu de secret : la route est donc limitée en débit
 * pour empêcher l'énumération, et ne renvoie que les champs nécessaires
 * au billet, au badge et au reçu.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  try {
    const { ref } = await params;

    if (!REF_PATTERN.test(ref)) {
      return NextResponse.json({ error: "Participant introuvable" }, { status: 404 });
    }

    const blocked = await rateLimit(req, "participant-lookup", 30, "60 s");
    if (blocked) return blocked;

    const participant = await prisma.participant.findUnique({
      where: { reference: ref },
      select: {
        reference: true,
        ticketNumber: true,
        prenom: true,
        nom: true,
        email: true,
        organisation: true,
        titre: true,
        photoUrl: true,
        type: true,
        statut: true,
        montant: true,
        event: {
          select: {
            slug: true,
            nom: true,
            type: true,
            lieu: true,
            ville: true,
            dateDebut: true,
            dateFin: true,
            organisateur: true,
            prixBadge: true,
            prixTicket: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant introuvable" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: participant });
  } catch (err) {
    log.error("Lecture participant impossible", { route: "GET /api/participants/[ref]" }, err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
