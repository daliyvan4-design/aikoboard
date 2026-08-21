import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") || "30") || 30, 365);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const commandes = await prisma.commande.findMany({
    where: { createdAt: { gte: since }, statut: { not: "ANNULEE" } },
    include: {
      lignes: {
        include: { service: true, residenceTarif: { include: { residence: true } } },
      },
    },
  });

  const caByDay: Record<string, number> = {};
  for (const c of commandes) {
    const day = c.createdAt.toISOString().split("T")[0];
    caByDay[day] = (caByDay[day] || 0) + c.montantTotal;
  }

  const serviceCA: Record<string, { nom: string; qty: number; ca: number }> = {};
  for (const c of commandes) {
    for (const l of c.lignes) {
      // Un service du catalogue, ou une chambre d une residence du parc
      const key = l.serviceId ?? l.residenceTarifId;
      if (!key) continue;
      if (!serviceCA[key]) {
        serviceCA[key] = {
          nom:
            l.service?.nom ??
            (l.residenceTarif
              ? `${l.residenceTarif.residence.nom} · ${l.residenceTarif.label}`
              : "Prestation"),
          qty: 0,
          ca: 0,
        };
      }
      serviceCA[key].qty += l.quantite;
      serviceCA[key].ca += l.sousTotal;
    }
  }
  const topServices = Object.values(serviceCA).sort((a, b) => b.ca - a.ca).slice(0, 5);

  const totalCA = commandes.reduce((s, c) => s + c.montantTotal, 0);
  const avgBasket = commandes.length > 0 ? Math.round(totalCA / commandes.length) : 0;

  const allCommandes = await prisma.commande.count({ where: { createdAt: { gte: since } } });
  const confirmed = await prisma.commande.count({ where: { createdAt: { gte: since }, statut: "CONFIRMEE" } });
  const confRate = allCommandes > 0 ? Math.round((confirmed / allCommandes) * 100) : 0;

  return NextResponse.json({ caByDay, topServices, totalCA, avgBasket, confRate, orderCount: commandes.length });
}
