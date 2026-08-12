import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";
import { refundPayment } from "@/lib/geniuspay";
import { log } from "@/lib/logger";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN", "SUPERVISEUR", "CONCIERGE");
  if (error) return error;

  const { id } = await params;

  if (session!.user.role === "CONCIERGE") {
    const assignment = await prisma.assignment.findFirst({
      where: { commandeId: id, conciergeId: session!.user.id, actif: true },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  const commande = await prisma.commande.findUnique({
    where: { id },
    include: { lignes: { include: { service: true, tarif: true } } },
  });

  if (!commande) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(commande);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { statut } = body;

  if (!["EN_ATTENTE", "CONFIRMEE", "ANNULEE", "PAYEE"].includes(statut)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  if (statut === "ANNULEE") {
    const payments = await prisma.payment.findMany({
      where: {
        metadata: { contains: id },
        statut: "completed",
      },
    });

    for (const payment of payments) {
      try {
        await refundPayment(payment.reference);
        await prisma.payment.update({
          where: { id: payment.id },
          data: { statut: "rembourse" },
        });
        log.info(`Remboursement automatique: ${payment.reference}`, { route: "PATCH /api/admin/commandes/[id]" });
      } catch {
        log.error(`Echec remboursement: ${payment.reference}`, { route: "PATCH /api/admin/commandes/[id]" });
      }
    }
  }

  const commande = await prisma.commande.update({
    where: { id },
    data: { statut },
  });

  return NextResponse.json(commande);
}
