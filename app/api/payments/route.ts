export const runtime = "nodejs";
export const preferredRegion = "cdg1";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createPayment,
  isGeniusPayConfigured,
  type CreatePaymentInput,
} from "@/lib/geniuspay";
import { rateLimit } from "@/lib/rate-limit";

function genPayRef() {
  const bytes = require("crypto").randomBytes(6);
  return `PAY-${bytes.toString("hex").toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  if (!isGeniusPayConfigured()) {
    return NextResponse.json(
      { error: "Payment system not configured" },
      { status: 503 },
    );
  }

  try {
    const blocked = await rateLimit(req, "payments", 3, "60 s");
    if (blocked) return blocked;

    const idempotencyKey = req.headers.get("x-idempotency-key");
    if (idempotencyKey) {
      const existing = await prisma.payment.findFirst({ where: { reference: idempotencyKey } });
      if (existing) {
        return NextResponse.json({ success: true, reference: existing.reference, duplicate: true });
      }
    }

    const body = (await req.json()) as {
      amount: number;
      currency?: string;
      description?: string;
      customer_name?: string;
      customer_email?: string;
      customer_phone?: string;
      event_slug?: string;
      participant_ref?: string;
      type?: string;
    };

    if (!body.amount || typeof body.amount !== "number" || body.amount < 200) {
      return NextResponse.json(
        { error: "Montant minimum : 200 XOF" },
        { status: 400 },
      );
    }

    if (body.event_slug && body.participant_ref) {
      const evt = await prisma.event.findUnique({
        where: { slug: body.event_slug },
        select: { prixBadge: true, prixTicket: true, badgePayant: true, ticketPayant: true },
      });
      if (evt) {
        const expectedPrice = evt.badgePayant ? evt.prixBadge : evt.ticketPayant ? evt.prixTicket : 0;
        if (expectedPrice > 0 && body.amount < expectedPrice) {
          return NextResponse.json(
            { error: `Montant insuffisant. Prix attendu : ${expectedPrice} XOF` },
            { status: 400 },
          );
        }
      }
    }

    const origin = req.headers.get("origin") ?? "";
    const payRef = genPayRef();

    const successParams = new URLSearchParams({ ref: payRef });
    if (body.participant_ref) successParams.set("p", body.participant_ref);
    if (body.event_slug) successParams.set("event", body.event_slug);
    if (body.type) successParams.set("type", body.type);

    let eventId: string | undefined;
    if (body.event_slug) {
      const event = await prisma.event.findUnique({
        where: { slug: body.event_slug },
        select: { id: true },
      });
      if (event) eventId = event.id;
    }

    await prisma.payment.create({
      data: {
        reference: payRef,
        type: body.type ?? "other",
        montant: body.amount,
        devise: body.currency ?? "XOF",
        statut: "pending",
        customerName: body.customer_name,
        customerEmail: body.customer_email,
        eventId,
        metadata: JSON.stringify({
          participant_ref: body.participant_ref,
          event_slug: body.event_slug,
          type: body.type,
        }),
      },
    });

    const input: CreatePaymentInput = {
      amount: body.amount,
      currency: (body.currency as "XOF" | "EUR" | "USD") ?? "XOF",
      description: body.description ?? "Paiement AIKO Board",
      customer: {
        name: body.customer_name,
        email: body.customer_email,
        phone: body.customer_phone,
        country: "CI",
      },
      success_url: `${origin}/fr/paiement/succes?${successParams.toString()}`,
      error_url: `${origin}/fr/paiement/echec?ref=${payRef}`,
      metadata: {
        pay_ref: payRef,
        ...(body.participant_ref && { participant_ref: body.participant_ref }),
        ...(body.event_slug && { event_slug: body.event_slug }),
        ...(body.type && { type: body.type }),
        platform: "aiko-board",
      },
    };

    const payment = await createPayment(input);

    await prisma.payment.update({
      where: { reference: payRef },
      data: { geniusRef: payment.reference },
    });

    return NextResponse.json({
      success: true,
      reference: payRef,
      genius_reference: payment.reference,
      checkout_url: payment.checkout_url,
      payment_url: payment.payment_url,
      status: payment.status,
    });
  } catch (err: unknown) {
    console.error("[payments] error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Erreur de paiement" }, { status: 500 });
  }
}
