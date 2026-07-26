import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, type WebhookPayload } from "@/lib/geniuspay";
import { sendConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const event = req.headers.get("x-webhook-event") ?? "";

  const rawBody = await req.text();

  if (!verifyWebhookSignature(timestamp, rawBody, signature)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 },
    );
  }

  const payload = JSON.parse(rawBody) as WebhookPayload;

  switch (event) {
    case "payment.success": {
      const { metadata } = payload.data;
      const payRef = metadata?.pay_ref;

      if (payRef) {
        await prisma.payment.updateMany({
          where: { reference: payRef },
          data: {
            statut: "completed",
            geniusRef: payload.data.reference?.toString(),
            methode: payload.data.payment_method,
          },
        });
      }

      const participantRef = metadata?.participant_ref;
      if (participantRef) {
        await prisma.participant.updateMany({
          where: { reference: participantRef },
          data: {
            statut: "confirme",
            paymentRef: payRef,
          },
        });

        const participant = await prisma.participant.findUnique({
          where: { reference: participantRef },
          include: { event: true },
        });
        if (participant) {
          const fmtDate = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
          sendConfirmationEmail({
            to: participant.email,
            participantName: `${participant.prenom} ${participant.nom}`,
            eventName: participant.event.nom,
            eventDate: `${participant.event.dateDebut.toLocaleDateString("fr-FR", { day: "numeric" })} — ${fmtDate(participant.event.dateFin)}`,
            eventLieu: `${participant.event.lieu} · ${participant.event.ville}`,
            reference: participant.reference,
            ticketNumber: participant.ticketNumber,
            type: participant.type as "badge" | "ticket",
            amount: participant.montant,
          }).catch(() => {});

          sendAdminNotificationEmail({
            type: "payment_received",
            eventName: participant.event.nom,
            participantName: `${participant.prenom} ${participant.nom}`,
            reference: participant.reference,
            amount: participant.montant,
          }).catch(() => {});
        }
      }

      const eventSlug = metadata?.event_slug;
      const type = metadata?.type;
      if (eventSlug && type === "event_creation") {
        await prisma.event.updateMany({
          where: { slug: eventSlug },
          data: {
            statut: "actif",
            paymentRef: payRef,
          },
        });
      }

      console.log(
        `[GeniusPay] Payment completed: ${payRef} — participant: ${participantRef ?? "n/a"} — event: ${eventSlug ?? "n/a"}`,
      );
      break;
    }

    case "payment.failed":
    case "payment.cancelled":
    case "payment.expired": {
      const { metadata, status } = payload.data;
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
          where: { reference: participantRef },
          data: { statut: "echoue" },
        });
      }

      console.log(`[GeniusPay] Payment ${status}: ${payRef}`);
      break;
    }

    case "payment.refunded": {
      const { metadata, amount } = payload.data;
      const payRef = metadata?.pay_ref;

      if (payRef) {
        await prisma.payment.updateMany({
          where: { reference: payRef },
          data: { statut: "rembourse" },
        });
      }

      console.log(`[GeniusPay] Payment refunded: ${payRef} — ${amount} XOF`);
      break;
    }

    default:
      console.log(`[GeniusPay] Unhandled event: ${event}`);
  }

  return NextResponse.json({ received: true });
}
