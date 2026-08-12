import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  try {
    const { ref } = await params;
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
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
