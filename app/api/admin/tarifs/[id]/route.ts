import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN", "CONCIERGE");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const data: any = {};
  if (body.label !== undefined) data.label = body.label;
  if (body.prix !== undefined) data.prix = body.prix;

  const tarif = await prisma.tarif.update({ where: { id }, data });
  return NextResponse.json(tarif);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN", "CONCIERGE");
  if (error) return error;

  const { id } = await params;
  await prisma.tarif.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
