import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1") || 1;
  const limit = Math.min(parseInt(searchParams.get("limit") || "10") || 10, 100);
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";

  const where: any = {};
  if (status) where.statut = status;
  if (search) {
    where.OR = [
      { reference: { contains: search, mode: "insensitive" } },
      { nom: { contains: search, mode: "insensitive" } },
      { prenom: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.commande.findMany({
      where,
      include: { lignes: { include: { service: { select: { categorie: true } } } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.commande.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, limit });
}
