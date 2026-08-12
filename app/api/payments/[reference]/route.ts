import { NextRequest, NextResponse } from "next/server";
import { getPayment, isGeniusPayConfigured } from "@/lib/geniuspay";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { applyPaymentSuccess, parsePaymentMetadata } from "@/lib/payment-flow";
import { log } from "@/lib/logger";

/**
 * Vérifie un paiement auprès de GeniusPay et réconcilie la base.
 *
 * Filet de sécurité du webhook : si celui-ci n'arrive pas (webhook non
 * configuré, indisponibilité), la page de succès finit quand même par
 * confirmer l'inscription ou activer l'événement — sur la foi de l'API
 * GeniusPay, jamais sur celle du client.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  if (!isGeniusPayConfigured()) {
    return NextResponse.json(
      { error: "Payment system not configured" },
      { status: 503 },
    );
  }

  const blocked = await rateLimit(req, "payment-status", 30, "60 s");
  if (blocked) return blocked;

  try {
    const { reference } = await params;

    const local = await prisma.payment.findUnique({ where: { reference } });
    const payment = await getPayment(local?.geniusRef ?? reference);

    if (payment.status === "completed") {
      const meta = parsePaymentMetadata(local?.metadata ?? null);
      await applyPaymentSuccess({
        payRef: local?.reference ?? reference,
        participantRef: meta.participant_ref,
        eventSlug: meta.event_slug,
        type: meta.type,
        geniusRef: payment.reference?.toString(),
        method: payment.payment_method,
      });
    } else if (local && local.statut === "pending" && payment.status !== "pending") {
      const mapped =
        payment.status === "failed" ? "echoue"
        : payment.status === "cancelled" ? "annule"
        : payment.status === "expired" ? "expire"
        : payment.status === "refunded" ? "rembourse"
        : null;
      if (mapped) {
        await prisma.payment.updateMany({
          where: { reference: local.reference },
          data: { statut: mapped },
        });
      }
    }

    return NextResponse.json({
      success: true,
      reference: payment.reference,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      payment_method: payment.payment_method,
      completed_at: payment.completed_at,
    });
  } catch (err: unknown) {
    log.error("Verification de paiement impossible", { route: "GET /api/payments/[reference]" }, err);
    return NextResponse.json({ error: "Erreur de verification" }, { status: 500 });
  }
}
