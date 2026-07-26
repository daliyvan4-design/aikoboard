import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const event = await prisma.event.update({
    where: { id },
    data: { statut: body.statut },
  });

  return NextResponse.json({ success: true, data: event });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;

  await prisma.event.update({
    where: { id },
    data: { statut: "supprime" },
  });

  return NextResponse.json({ success: true });
}
