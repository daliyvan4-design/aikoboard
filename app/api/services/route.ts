import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const services = await prisma.service.findMany({
    where: { actif: true },
    include: { tarifs: { where: { actif: true } } },
    orderBy: { ordre: "asc" },
  });

  // Regroupement dynamique : une nouvelle categorie ajoutee au catalogue
  // apparait d'elle-meme, au lieu de disparaitre silencieusement d'une
  // liste ecrite en dur.
  const grouped: Record<string, typeof services> = {};
  for (const service of services) {
    (grouped[service.categorie] ??= []).push(service);
  }

  // "extra" est conserve : le tunnel de reservation historique le lit
  grouped.extra = grouped.extras ?? [];

  return NextResponse.json(grouped);
}
