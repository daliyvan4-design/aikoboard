import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const { error } = await requireRole("ADMIN", "CONCIERGE");
  if (error) return error;

  const { serviceId, label, prix } = await request.json();

  const tarif = await prisma.tarif.create({
    data: { serviceId, label: label || "Nouveau tarif", prix: prix || 0 },
  });

  return NextResponse.json(tarif, { status: 201 });
}
