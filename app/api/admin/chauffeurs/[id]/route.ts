import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (typeof body.nom === "string") data.nom = body.nom.trim().substring(0, 100);
  if (typeof body.telephone === "string") data.telephone = body.telephone.trim().substring(0, 30);
  if (typeof body.vehicule === "string") data.vehicule = body.vehicule.trim().substring(0, 100);
  if (typeof body.immatriculation === "string") data.immatriculation = body.immatriculation.trim().substring(0, 20);
  if (typeof body.statut === "string" && ["actif", "inactif"].includes(body.statut)) data.statut = body.statut;

  const chauffeur = await prisma.chauffeur.update({ where: { id }, data });
  return NextResponse.json(chauffeur);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  const { id } = await params;
  await prisma.chauffeur.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
