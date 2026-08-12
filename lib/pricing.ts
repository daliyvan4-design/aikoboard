// Source de vérité des prix côté serveur.
// Le client peut proposer un montant, il n'est jamais cru sur parole.

export const EVENT_CREATION_PRICE_XOF = 32_500;
export const MIN_PAYMENT_XOF = 200;

export interface EventPricing {
  badgePayant: boolean;
  prixBadge: number;
  ticketPayant: boolean;
  prixTicket: number;
}

/** Prix attendu pour une inscription, selon le type réellement demandé. */
export function expectedParticipantAmount(event: EventPricing, type: string): number {
  if (type === "ticket") return event.ticketPayant ? Math.max(0, event.prixTicket) : 0;
  return event.badgePayant ? Math.max(0, event.prixBadge) : 0;
}

/** Type d'inscription par défaut pour un événement donné. */
export function defaultParticipantType(eventType: string): "badge" | "ticket" {
  return eventType === "concert" ? "ticket" : "badge";
}

/**
 * Montant attendu pour un paiement, ou null si le type de paiement
 * n'a pas de tarif de référence (réservation conciergerie, etc.).
 */
export function expectedPaymentAmount(
  type: string | undefined,
  event: EventPricing | null,
): number | null {
  if (type === "event_creation") return EVENT_CREATION_PRICE_XOF;
  if ((type === "badge" || type === "ticket") && event) {
    return expectedParticipantAmount(event, type);
  }
  return null;
}
