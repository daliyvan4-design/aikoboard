import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireAnyAdmin } from "@/lib/admin-auth";
import { log } from "@/lib/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  try {
    const { error: authError } = await requireAnyAdmin();
    if (authError) return authError;

    const blocked = await rateLimit(req, "checkin", 20, "60 s");
    if (blocked) return blocked;
    const { ref } = await params;
    const participant = await prisma.participant.findUnique({
      where: { reference: ref },
      include: {
        event: {
          select: {
            nom: true,
            slug: true,
            type: true,
            dateDebut: true,
            dateFin: true,
            lieu: true,
            ville: true,
            organisateur: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: "Reference introuvable", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (participant.statut !== "confirme") {
      return NextResponse.json(
        {
          success: false,
          error: `Participant non confirme (statut: ${participant.statut})`,
          code: "NOT_CONFIRMED",
          data: {
            prenom: participant.prenom,
            nom: participant.nom,
            statut: participant.statut,
          },
        },
        { status: 400 },
      );
    }

    if (participant.checkedIn) {
      return NextResponse.json({
        success: false,
        error: "Deja scanne",
        code: "ALREADY_CHECKED_IN",
        data: {
          prenom: participant.prenom,
          nom: participant.nom,
          email: participant.email,
          organisation: participant.organisation,
          titre: participant.titre,
          photoUrl: participant.photoUrl,
          reference: participant.reference,
          ticketNumber: participant.ticketNumber,
          type: participant.type,
          checkedInAt: participant.checkedInAt,
          event: participant.event,
        },
      });
    }

    const updated = await prisma.participant.update({
      where: { reference: ref },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
      },
      include: {
        event: {
          select: {
            nom: true,
            slug: true,
            type: true,
            dateDebut: true,
            dateFin: true,
            lieu: true,
            ville: true,
            organisateur: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        prenom: updated.prenom,
        nom: updated.nom,
        email: updated.email,
        organisation: updated.organisation,
        titre: updated.titre,
        photoUrl: updated.photoUrl,
        reference: updated.reference,
        ticketNumber: updated.ticketNumber,
        type: updated.type,
        checkedInAt: updated.checkedInAt,
        event: {
          nom: updated.event.nom,
          slug: updated.event.slug,
          type: updated.event.type,
          dateDebut: updated.event.dateDebut,
          dateFin: updated.event.dateFin,
          lieu: updated.event.lieu,
          ville: updated.event.ville,
          organisateur: updated.event.organisateur,
        },
      },
    });
  } catch (err) {
    log.error("Check-in impossible", { route: "POST /api/participants/[ref]/checkin" }, err);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
