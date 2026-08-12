// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { EVENT_CREATION_PRICE_XOF } from "@/lib/pricing";

const prismaMock = {
  payment: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  event: { findUnique: vi.fn() },
  participant: { findUnique: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/geniuspay", () => ({
  isGeniusPayConfigured: () => true,
  createPayment: vi.fn().mockResolvedValue({
    reference: "GP-1",
    checkout_url: "https://pay.genius.ci/checkout/1",
    status: "pending",
  }),
}));

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/payments", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://aikoboard.com" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("POST /api/payments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.payment.findFirst.mockResolvedValue(null);
    prismaMock.payment.create.mockResolvedValue({});
    prismaMock.payment.update.mockResolvedValue({});
    prismaMock.event.findUnique.mockResolvedValue(null);
    prismaMock.participant.findUnique.mockResolvedValue(null);
  });

  it("refuse une creation d'evenement sous-payee", async () => {
    const { POST } = await import("@/app/api/payments/route");

    const res = await POST(makeRequest({ amount: 200, type: "event_creation", event_slug: "x" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/insuffisant/i);
    expect(prismaMock.payment.create).not.toHaveBeenCalled();
  });

  it("accepte une creation d'evenement au tarif serveur", async () => {
    const { POST } = await import("@/app/api/payments/route");

    const res = await POST(
      makeRequest({ amount: EVENT_CREATION_PRICE_XOF, type: "event_creation", event_slug: "x" }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.checkout_url).toBe("https://pay.genius.ci/checkout/1");
  });

  it("refuse de repayer un evenement deja actif", async () => {
    prismaMock.event.findUnique.mockResolvedValue({ statut: "actif" });
    const { POST } = await import("@/app/api/payments/route");

    const res = await POST(
      makeRequest({ amount: EVENT_CREATION_PRICE_XOF, type: "event_creation", event_slug: "x" }),
    );

    expect(res.status).toBe(400);
  });

  it("aligne le montant sur le tarif reel de l'inscription enregistree", async () => {
    prismaMock.participant.findUnique.mockResolvedValue({
      type: "badge",
      event: { badgePayant: true, prixBadge: 10_000, ticketPayant: true, prixTicket: 2_000 },
    });
    const { POST } = await import("@/app/api/payments/route");

    // Le client tente de payer le prix du ticket pour un badge.
    const res = await POST(
      makeRequest({ amount: 2_000, type: "badge", participant_ref: "AIKO-1", event_slug: "x" }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("10000");
  });

  it("rejette un montant sous le minimum absolu", async () => {
    const { POST } = await import("@/app/api/payments/route");

    const res = await POST(makeRequest({ amount: 50, type: "reservation" }));

    expect(res.status).toBe(400);
  });
});
