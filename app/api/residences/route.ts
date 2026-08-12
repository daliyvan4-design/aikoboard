import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";
import { log } from "@/lib/logger";

export async function GET() {
  try {
    const residences = await prisma.residence.findMany({
      where: { statut: "actif" },
      select: {
        id: true,
        nom: true,
        type: true,
        description: true,
        adresse: true,
        ville: true,
        quartier: true,
        latitude: true,
        longitude: true,
        capacite: true,
        equipements: true,
        statut: true,
        images: { orderBy: { ordre: "asc" }, select: { id: true, url: true, legende: true, ordre: true } },
        tarifs: { where: { actif: true }, orderBy: { prixParNuit: "asc" }, select: { id: true, label: true, typeChambre: true, prixParNuit: true, devise: true, capacite: true } },
        _count: { select: { events: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: residences });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  try {
    const body = await req.json();

    const residence = await prisma.residence.create({
      data: {
        nom: body.nom,
        type: body.type ?? "hotel",
        description: body.description,
        adresse: body.adresse,
        ville: body.ville,
        quartier: body.quartier,
        latitude: body.latitude ? parseFloat(body.latitude) || null : null,
        longitude: body.longitude ? parseFloat(body.longitude) || null : null,
        capacite: body.capacite ? parseInt(body.capacite) || 10 : 10,
        equipements: body.equipements,
        contactNom: body.contactNom,
        contactTel: body.contactTel,
        contactEmail: body.contactEmail,
      },
    });

    return NextResponse.json({ success: true, id: residence.id });
  } catch (err) {
    log.error("Creation residence impossible", { route: "POST /api/residences" }, err);
    return NextResponse.json({ error: "Erreur creation" }, { status: 500 });
  }
}
