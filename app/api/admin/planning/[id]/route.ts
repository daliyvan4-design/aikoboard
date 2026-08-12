import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN", "SUPERVISEUR", "CONCIERGE");
  if (error) return error;

  const { id } = await params;

  if (session!.user.role === "CONCIERGE") {
    const entry = await prisma.planningEntry.findUnique({ where: { id }, select: { commandeId: true } });
    if (!entry) return NextResponse.json({ error: "Entree introuvable" }, { status: 404 });

    const assignment = await prisma.assignment.findFirst({
      where: { commandeId: entry.commandeId, conciergeId: session!.user.id, actif: true },
    });
    if (!assignment) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (typeof body.heure === "string") data.heure = body.heure;
  if (typeof body.titre === "string") data.titre = body.titre.substring(0, 200);
  if (typeof body.details === "string") data.details = body.details.substring(0, 1000);
  if (typeof body.type === "string") data.type = body.type;

  const updated = await prisma.planningEntry.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  const { id } = await params;
  await prisma.planningEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
