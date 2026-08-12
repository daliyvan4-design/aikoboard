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
import { log } from "@/lib/logger";
import {
  EVENT_CREATION_PRICE_XOF,
  MIN_PAYMENT_XOF,
  expectedParticipantAmount,
} from "@/lib/pricing";
import { randomBytes } from "crypto";

function genPayRef() {
  return `PAY-${randomBytes(6).toString("hex").toUpperCase()}`;
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

    if (!body.amount || typeof body.amount !== "number" || body.amount < MIN_PAYMENT_XOF) {
      return NextResponse.json(
        { error: `Montant minimum : ${MIN_PAYMENT_XOF} XOF` },
        { status: 400 },
      );
    }

    // Le tarif attendu est toujours recalculé côté serveur : soit le prix de
    // création d'événement, soit le prix de l'inscription telle qu'elle est
    // réellement enregistrée en base.
    let expectedPrice: number | null = null;

    if (body.type === "event_creation") {
      expectedPrice = EVENT_CREATION_PRICE_XOF;

      if (body.event_slug) {
        const evt = await prisma.event.findUnique({
          where: { slug: body.event_slug },
          select: { statut: true },
        });
        if (evt?.statut === "actif") {
          return NextResponse.json(
            { error: "Cet evenement est deja actif" },
            { status: 400 },
          );
        }
      }
    } else if (body.participant_ref) {
      const participant = await prisma.participant.findUnique({
        where: { reference: body.participant_ref },
        select: {
          type: true,
          event: {
            select: { badgePayant: true, prixBadge: true, ticketPayant: true, prixTicket: true },
          },
        },
      });
      if (participant) {
        expectedPrice = expectedParticipantAmount(participant.event, participant.type);
      }
    } else if (body.event_slug && (body.type === "badge" || body.type === "ticket")) {
      const evt = await prisma.event.findUnique({
        where: { slug: body.event_slug },
        select: { badgePayant: true, prixBadge: true, ticketPayant: true, prixTicket: true },
      });
      if (evt) expectedPrice = expectedParticipantAmount(evt, body.type);
    }

    if (expectedPrice !== null) {
      if (expectedPrice <= 0) {
        return NextResponse.json(
          { error: "Aucun paiement requis pour cette inscription" },
          { status: 400 },
        );
      }
      if (body.amount < expectedPrice) {
        return NextResponse.json(
          { error: `Montant insuffisant. Prix attendu : ${expectedPrice} XOF` },
          { status: 400 },
        );
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
    log.error("Creation de paiement impossible", { route: "POST /api/payments" }, err);
    return NextResponse.json({ error: "Erreur de paiement" }, { status: 500 });
  }
}
