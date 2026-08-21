import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

/**
 * Catalogue complet pour le back-office.
 *
 * Contrairement à /api/services, qui ne sert que ce qui est visible du
 * public, cette route renvoie aussi les services masqués : sans cela un
 * service désactivé disparaîtrait de l'éditeur et ne pourrait plus jamais
 * être réactivé.
 */
export async function GET() {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  const services = await prisma.service.findMany({
    include: { tarifs: { orderBy: { prix: "asc" } } },
    orderBy: [{ categorie: "asc" }, { ordre: "asc" }],
  });

  return NextResponse.json({ success: true, data: services });
}
