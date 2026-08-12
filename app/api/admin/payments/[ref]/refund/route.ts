import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";
import { refundPayment, GeniusPayError } from "@/lib/geniuspay";
import { log } from "@/lib/logger";

export const preferredRegion = "cdg1";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { ref } = await params;

  const payment = await prisma.payment.findUnique({
    where: { reference: ref },
  });

  if (!payment) {
    return NextResponse.json(
      { success: false, error: "Paiement introuvable" },
      { status: 404 },
    );
  }

  if (payment.statut !== "completed") {
    return NextResponse.json(
      { success: false, error: `Impossible de rembourser un paiement ${payment.statut}` },
      { status: 400 },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawAmount = body.amount ? parseFloat(body.amount) : undefined;
    const amount = rawAmount && !isNaN(rawAmount) && rawAmount > 0 ? rawAmount : undefined;

    const result = await refundPayment(ref, amount);

    await prisma.payment.update({
      where: { reference: ref },
      data: { statut: "rembourse" },
    });

    const meta = payment.metadata ? JSON.parse(payment.metadata) : {};
    if (meta.participant_ref) {
      await prisma.participant.updateMany({
        where: { reference: meta.participant_ref },
        data: { statut: "rembourse" },
      });
    }

    log.info(`Payment refunded: ${ref}`, { route: "POST /api/admin/payments/[ref]/refund" });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof GeniusPayError) {
      log.error(`GeniusPay error: ${err.code}`, { route: "POST /api/admin/payments/[ref]/refund" });
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.httpStatus },
      );
    }
    log.error("Remboursement impossible", { route: "POST /api/admin/payments/[ref]/refund" }, err);
    return NextResponse.json(
      { success: false, error: "Erreur lors du remboursement" },
      { status: 500 },
    );
  }
}
