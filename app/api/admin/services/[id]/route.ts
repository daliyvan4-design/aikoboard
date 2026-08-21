import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const data: { actif?: boolean; prixBase?: number } = {};
  if (body.actif !== undefined) data.actif = body.actif;
  // Prix de reference : c'est celui que voit le participant quand le
  // service n'a pas de tarif detaille. Il doit s'editer ici, sinon le
  // back-office affiche un montant que personne ne peut corriger.
  if (body.prixBase !== undefined) {
    const prix = Number(body.prixBase);
    if (!Number.isFinite(prix) || prix < 0) {
      return NextResponse.json({ error: "Prix invalide" }, { status: 400 });
    }
    data.prixBase = Math.round(prix);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Rien a modifier" }, { status: 400 });
  }

  const service = await prisma.service.update({ where: { id }, data });
  return NextResponse.json(service);
}
