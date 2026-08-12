import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, type WebhookPayload } from "@/lib/geniuspay";
import { applyPaymentSuccess } from "@/lib/payment-flow";
import { alertCritical } from "@/lib/alert";
import { log } from "@/lib/logger";

/** Tolérance d'horloge acceptée pour un webhook (anti-rejeu). */
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

/** Normalise un timestamp unix en millisecondes (secondes ou ms acceptées). */
function toMillis(value: string | number | undefined): number | null {
  if (value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > 1e12 ? n : n * 1000;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const event = req.headers.get("x-webhook-event") ?? "";

  const rawBody = await req.text();

  if (!verifyWebhookSignature(timestamp, rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 1. Fraîcheur : une signature valide capturee ne doit pas rester
  // rejouable indefiniment.
  const sentAt = toMillis(timestamp) ?? toMillis(payload.timestamp);
  if (sentAt === null) {
    return NextResponse.json({ error: "Missing timestamp" }, { status: 400 });
  }
  if (Math.abs(Date.now() - sentAt) > MAX_CLOCK_SKEW_MS) {
    log.warn("Webhook hors fenetre temporelle", { route: "POST /api/webhooks/geniuspay", event });
    return NextResponse.json({ error: "Timestamp out of range" }, { status: 400 });
  }

  // 2. Idempotence : le meme evenement n'est traite qu'une fois.
  const eventId = typeof payload.id === "string" && payload.id ? payload.id : null;
  if (!eventId) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  try {
    await prisma.webhookEvent.create({
      data: { id: eventId, source: "geniuspay", event },
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Base injoignable : le paiement est encaisse mais rien ne sera
    // enregistre. C'est l'incident le plus couteux du systeme.
    await alertCritical({
      key: "webhook-journal-failed",
      title: "Webhook GeniusPay non journalise",
      details: { event, eventId },
      error: err,
    });
    throw err;
  }

  const { metadata } = payload.data;

  switch (event) {
    case "payment.success": {
      await applyPaymentSuccess({
        payRef: metadata?.pay_ref,
        participantRef: metadata?.participant_ref,
        eventSlug: metadata?.event_slug,
        type: metadata?.type,
        geniusRef: payload.data.reference?.toString(),
        method: payload.data.payment_method,
      });
      log.info("Paiement complete", { ref: metadata?.pay_ref ?? "n/a", event });
      break;
    }

    case "payment.failed":
    case "payment.cancelled":
    case "payment.expired": {
      const { status } = payload.data;
      const payRef = metadata?.pay_ref;
      const dbStatus = status === "failed" ? "echoue" : status === "cancelled" ? "annule" : "expire";

      if (payRef) {
        await prisma.payment.updateMany({
          where: { reference: payRef },
          data: { statut: dbStatus },
        });
      }

      const participantRef = metadata?.participant_ref;
      if (participantRef) {
        await prisma.participant.updateMany({
          where: { reference: participantRef, statut: { not: "confirme" } },
          data: { statut: "echoue" },
        });
      }

      log.info(`Paiement ${status}`, { ref: payRef ?? "n/a", event });
      break;
    }

    case "payment.refunded": {
      const payRef = metadata?.pay_ref;

      if (payRef) {
        await prisma.payment.updateMany({
          where: { reference: payRef },
          data: { statut: "rembourse" },
        });
      }

      log.info("Paiement rembourse", { ref: payRef ?? "n/a", event });
      break;
    }

    default:
      log.warn("Webhook non gere", { event });
  }

  return NextResponse.json({ received: true });
}
