import { describe, it, expect } from "vitest";
import {
  EVENT_CREATION_PRICE_XOF,
  expectedParticipantAmount,
  expectedPaymentAmount,
  defaultParticipantType,
} from "@/lib/pricing";

const paidBoth = {
  badgePayant: true,
  prixBadge: 10_000,
  ticketPayant: true,
  prixTicket: 2_000,
};

describe("pricing", () => {
  it("facture le badge au prix du badge, le ticket au prix du ticket", () => {
    expect(expectedParticipantAmount(paidBoth, "badge")).toBe(10_000);
    expect(expectedParticipantAmount(paidBoth, "ticket")).toBe(2_000);
  });

  it("ne facture rien quand le type n'est pas payant", () => {
    const badgeOnly = { ...paidBoth, ticketPayant: false };
    expect(expectedParticipantAmount(badgeOnly, "ticket")).toBe(0);
    expect(expectedParticipantAmount(badgeOnly, "badge")).toBe(10_000);
  });

  it("ignore un prix negatif en base", () => {
    expect(expectedParticipantAmount({ ...paidBoth, prixBadge: -5000 }, "badge")).toBe(0);
  });

  it("applique le tarif de creation d'evenement independamment du client", () => {
    expect(expectedPaymentAmount("event_creation", null)).toBe(EVENT_CREATION_PRICE_XOF);
  });

  it("n'impose pas de tarif aux paiements sans reference (reservation)", () => {
    expect(expectedPaymentAmount("reservation", paidBoth)).toBeNull();
    expect(expectedPaymentAmount(undefined, paidBoth)).toBeNull();
  });

  it("choisit le type par defaut selon l'evenement", () => {
    expect(defaultParticipantType("concert")).toBe("ticket");
    expect(defaultParticipantType("conference")).toBe("badge");
  });
});
