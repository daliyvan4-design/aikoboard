import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN", "CONCIERGE");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const data: any = {};
  if (body.actif !== undefined) data.actif = body.actif;

  const service = await prisma.service.update({ where: { id }, data });
  return NextResponse.json(service);
}
