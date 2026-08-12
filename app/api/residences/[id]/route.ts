import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const residence = await prisma.residence.findUnique({
      where: { id },
      include: {
        images: { orderBy: { ordre: "asc" } },
        tarifs: { orderBy: { prixParNuit: "asc" } },
      },
    });

    if (!residence) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: residence });
  } catch (err) {
    console.error("[residences] get error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();

    const residence = await prisma.residence.update({
      where: { id },
      data: {
        nom: body.nom,
        type: body.type,
        description: body.description,
        adresse: body.adresse,
        ville: body.ville,
        quartier: body.quartier,
        latitude: body.latitude !== undefined ? (parseFloat(body.latitude) || null) : undefined,
        longitude: body.longitude !== undefined ? (parseFloat(body.longitude) || null) : undefined,
        capacite: body.capacite ? (parseInt(body.capacite) || undefined) : undefined,
        equipements: body.equipements,
        contactNom: body.contactNom,
        contactTel: body.contactTel,
        contactEmail: body.contactEmail,
        statut: body.statut,
      },
    });

    return NextResponse.json({ success: true, id: residence.id });
  } catch (err) {
    console.error("[residences] update error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Erreur mise a jour" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.residence.update({
      where: { id },
      data: { statut: "inactif" },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[residences] delete error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
