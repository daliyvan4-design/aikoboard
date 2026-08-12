import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        _count: { select: { participants: true } },
        participants: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            prenom: true,
            nom: true,
            organisation: true,
            type: true,
            checkedIn: true,
            ticketNumber: true,
          },
        },
        residence: {
          include: {
            images: { orderBy: { ordre: "asc" }, take: 5 },
            tarifs: { where: { actif: true }, orderBy: { prixParNuit: "asc" } },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Evenement introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: event });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
