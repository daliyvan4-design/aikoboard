import { NextRequest, NextResponse } from "next/server";
import { getPayment, isGeniusPayConfigured } from "@/lib/geniuspay";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  if (!isGeniusPayConfigured()) {
    return NextResponse.json(
      { error: "Payment system not configured" },
      { status: 503 },
    );
  }

  try {
    const { reference } = await params;
    const payment = await getPayment(reference);

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
    const message =
      err instanceof Error ? err.message : "Erreur de vérification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
