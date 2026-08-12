import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";
import { log } from "@/lib/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();

    const maxOrdre = await prisma.residenceImage.findFirst({
      where: { residenceId: id },
      orderBy: { ordre: "desc" },
      select: { ordre: true },
    });

    const image = await prisma.residenceImage.create({
      data: {
        residenceId: id,
        url: body.url,
        legende: body.legende,
        ordre: (maxOrdre?.ordre ?? -1) + 1,
      },
    });

    return NextResponse.json({ success: true, id: image.id });
  } catch (err) {
    log.error("Ajout image residence impossible", { route: "POST /api/residences/[id]/images" }, err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json({ error: "imageId required" }, { status: 400 });
    }

    const image = await prisma.residenceImage.findFirst({ where: { id: imageId, residenceId: id } });
    if (!image) {
      return NextResponse.json({ error: "Image introuvable pour cette residence" }, { status: 404 });
    }

    await prisma.residenceImage.delete({ where: { id: imageId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    log.error("Suppression image residence impossible", { route: "DELETE /api/residences/[id]/images" }, err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
