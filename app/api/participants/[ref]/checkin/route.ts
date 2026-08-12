import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireAnyAdmin } from "@/lib/admin-auth";
import { assertEventAccess, readManageToken } from "@/lib/event-access";
import { log } from "@/lib/logger";

/**
 * Check-in d'un participant.
 *
 * Deux façons d'y accéder : une session admin AIKO, ou le token de gestion
 * de l'événement — c'est ce qui permet à un organisateur de scanner ses
 * propres badges sans compte admin. Avec un token, l'événement (`slug`) est
 * exigé : il est validé avant toute lecture de participant, pour qu'un
 * token invalide ne serve pas à deviner des références existantes.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  try {
    const blocked = await rateLimit(req, "checkin", 20, "60 s");
    if (blocked) return blocked;

    let scopedEventId: string | null = null;

    if (readManageToken(req)) {
      const slug = req.nextUrl.searchParams.get("slug") ?? "";
      const access = await assertEventAccess(req, slug);
      if (access.error) return access.error;
      scopedEventId = access.event.id;
    } else {
      const { error: authError } = await requireAnyAdmin();
      if (authError) return authError;
    }

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

    // Un organisateur ne scanne que les badges de son propre evenement.
    if (scopedEventId && participant.eventId !== scopedEventId) {
      return NextResponse.json(
        { success: false, error: "Badge d'un autre evenement", code: "WRONG_EVENT" },
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
