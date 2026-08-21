import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  const lignes = await prisma.ligneCommande.findMany({
    include: { service: { select: { categorie: true } } },
  });

  // Une ligne porte soit un service du catalogue, soit une nuitee dans une
  // residence du parc : dans le second cas la categorie est l hebergement.
  const totals: Record<string, number> = {
    transport: 0,
    vehicule: 0,
    hebergement: 0,
    repas: 0,
    extras: 0,
  };
  let grandTotal = 0;

  for (const l of lignes) {
    const cat = l.service?.categorie ?? (l.residenceTarifId ? "hebergement" : null);
    if (!cat) continue;
    totals[cat] = (totals[cat] || 0) + l.sousTotal;
    grandTotal += l.sousTotal;
  }

  const breakdown = Object.entries(totals).map(([cat, amount]) => ({
    categorie: cat,
    montant: amount,
    pourcentage: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
  }));

  return NextResponse.json(breakdown);
}
