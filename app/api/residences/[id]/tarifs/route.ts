import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();

    const tarif = await prisma.residenceTarif.create({
      data: {
        residenceId: id,
        label: body.label,
        typeChambre: body.typeChambre,
        prixParNuit: parseFloat(body.prixParNuit),
        devise: body.devise ?? "XOF",
        capacite: body.capacite ? parseInt(body.capacite) : 2,
      },
    });

    return NextResponse.json({ success: true, id: tarif.id });
  } catch (err) {
    console.error("[residence-tarifs] create error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  try {
    const body = await req.json();

    const tarif = await prisma.residenceTarif.update({
      where: { id: body.id },
      data: {
        label: body.label,
        typeChambre: body.typeChambre,
        prixParNuit: body.prixParNuit ? parseFloat(body.prixParNuit) : undefined,
        capacite: body.capacite ? parseInt(body.capacite) : undefined,
        actif: body.actif,
      },
    });

    return NextResponse.json({ success: true, id: tarif.id });
  } catch (err) {
    console.error("[residence-tarifs] update error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const tarifId = searchParams.get("tarifId");

    if (!tarifId) {
      return NextResponse.json({ error: "tarifId required" }, { status: 400 });
    }

    const tarif = await prisma.residenceTarif.findFirst({ where: { id: tarifId, residenceId: id } });
    if (!tarif) {
      return NextResponse.json({ error: "Tarif introuvable pour cette residence" }, { status: 404 });
    }

    await prisma.residenceTarif.delete({ where: { id: tarifId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[residence-tarifs] delete error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
