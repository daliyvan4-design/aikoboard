import { prisma } from "./prisma";
import { log } from "./logger";
import { sendConfirmationEmail, sendAdminNotificationEmail } from "./email";
import { sendOrganizerAccessBySlug } from "./organizer-access";

/**
 * Effets d'un paiement réussi, en un seul endroit : le webhook GeniusPay et
 * la réconciliation serveur (page de succès) passent tous les deux par ici.
 *
 * Toutes les écritures sont conditionnelles ("seulement si pas déjà fait"),
 * donc rejouer un paiement ne renvoie pas d'email en double et ne réactive
 * pas deux fois un événement.
 */

export interface PaymentSuccessInput {
  payRef?: string | null;
  participantRef?: string | null;
  eventSlug?: string | null;
  type?: string | null;
  geniusRef?: string | null;
  method?: string | null;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export async function applyPaymentSuccess(input: PaymentSuccessInput): Promise<void> {
  const { payRef, participantRef, eventSlug, type } = input;

  if (payRef) {
    await prisma.payment.updateMany({
      where: { reference: payRef },
      data: {
        statut: "completed",
        ...(input.geniusRef ? { geniusRef: input.geniusRef } : {}),
        ...(input.method ? { methode: input.method } : {}),
      },
    });
  }

  if (participantRef) {
    // Ne confirme que si ce n'était pas déjà fait : le compteur renvoyé
    // sert de verrou d'idempotence pour l'envoi des emails.
    const { count } = await prisma.participant.updateMany({
      where: { reference: participantRef, statut: { not: "confirme" } },
      data: { statut: "confirme", ...(payRef ? { paymentRef: payRef } : {}) },
    });

    if (count > 0) {
      const participant = await prisma.participant.findUnique({
        where: { reference: participantRef },
        include: { event: true },
      });

      if (participant) {
        sendConfirmationEmail({
          to: participant.email,
          participantName: `${participant.prenom} ${participant.nom}`,
          eventName: participant.event.nom,
          eventDate: `${participant.event.dateDebut.toLocaleDateString("fr-FR", { day: "numeric" })} - ${fmtDate(participant.event.dateFin)}`,
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
  }

  if (eventSlug && type === "event_creation") {
    const { count } = await prisma.event.updateMany({
      where: { slug: eventSlug, statut: { not: "actif" } },
      data: { statut: "actif", ...(payRef ? { paymentRef: payRef } : {}) },
    });

    if (count > 0) {
      log.info("Evenement active apres paiement", { slug: eventSlug, ref: payRef ?? undefined });
      sendOrganizerAccessBySlug(eventSlug).catch(() => {});
    }
  }
}

/** Métadonnées enregistrées à la création du paiement (JSON stocké en base). */
export function parsePaymentMetadata(metadata: string | null): {
  participant_ref?: string;
  event_slug?: string;
  type?: string;
} {
  if (!metadata) return {};
  try {
    const parsed = JSON.parse(metadata);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
