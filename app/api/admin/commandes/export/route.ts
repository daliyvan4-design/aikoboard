import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

function escapeCSV(val: string | number | null | undefined): string {
  const str = String(val ?? "");
  const escaped = str.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(escaped)) return `"'${escaped}"`;
  return `"${escaped}"`;
}

export async function GET(request: NextRequest) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";

  const where: Record<string, string> = {};
  if (status) where.statut = status;

  const commandes = await prisma.commande.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const sep = ";";
  const bom = "﻿";
  const header = ["Reference", "Prénom", "Nom", "Email", "Telephone", "Nationalité", "Arrivée", "Départ", "Personnes", "Montant", "Devise", "Statut"]
    .map(escapeCSV).join(sep);

  const rows = commandes.map((c) =>
    [
      c.reference,
      c.prenom,
      c.nom,
      c.email,
      c.telephone,
      c.nationalite,
      c.dateArrivee.toISOString().split("T")[0],
      c.dateDepart.toISOString().split("T")[0],
      c.nombrePersonnes,
      c.montantTotal,
      c.devise,
      c.statut,
    ].map(escapeCSV).join(sep)
  ).join("\r\n");

  return new NextResponse(bom + header + "\r\n" + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=commandes-aiko-${new Date().toISOString().split("T")[0]}.csv`,
    },
  });
}
