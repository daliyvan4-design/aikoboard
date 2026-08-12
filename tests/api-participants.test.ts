// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const prismaMock = {
  event: { findUnique: vi.fn() },
  participant: { count: vi.fn(), aggregate: vi.fn(), create: vi.fn(), findMany: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/email", () => ({
  sendConfirmationEmail: vi.fn().mockResolvedValue(null),
  sendAdminNotificationEmail: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/cloudinary", () => ({
  uploadBase64Image: vi.fn().mockResolvedValue({ url: "https://cdn/x.jpg", publicId: "x" }),
}));

const baseEvent = {
  id: "evt_1",
  slug: "avca-2026",
  nom: "AVCA 2026",
  type: "conference",
  statut: "actif",
  capacite: 2,
  badgePayant: true,
  prixBadge: 10_000,
  ticketPayant: false,
  prixTicket: 0,
  dateDebut: new Date("2026-09-01"),
  dateFin: new Date("2026-09-03"),
  lieu: "Sofitel",
  ville: "Abidjan",
};

const validBody = {
  prenom: "Amadou",
  nom: "Diallo",
  email: "amadou@example.com",
  telephone: "+2250700000000",
  organisation: "AIKO",
};

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/events/avca-2026/participants", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const params = { params: Promise.resolve({ slug: "avca-2026" }) };

/** $transaction(cb) exécutant le callback sur un client mocké. */
function withTransaction(opts: { taken: number; maxTicket: number | null }) {
  prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
    cb({
      participant: {
        count: vi.fn().mockResolvedValue(opts.taken),
        aggregate: vi.fn().mockResolvedValue({ _max: { ticketNumber: opts.maxTicket } }),
        create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
          reference: data.reference,
          ticketNumber: data.ticketNumber,
          type: data.type,
          montant: data.montant,
          statut: data.statut,
        })),
      },
    }),
  );
}

describe("POST /api/events/[slug]/participants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.event.findUnique.mockResolvedValue(baseEvent);
    withTransaction({ taken: 0, maxTicket: null });
  });

  it("refuse l'inscription tant que l'evenement n'est pas actif (non paye)", async () => {
    prismaMock.event.findUnique.mockResolvedValue({ ...baseEvent, statut: "pending" });
    const { POST } = await import("@/app/api/events/[slug]/participants/route");

    const res = await POST(makeRequest(validBody), params);

    expect(res.status).toBe(403);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("refuse l'inscription quand la capacite est atteinte", async () => {
    withTransaction({ taken: 2, maxTicket: 2 });
    const { POST } = await import("@/app/api/events/[slug]/participants/route");

    const res = await POST(makeRequest(validBody), params);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.code).toBe("EVENT_FULL");
  });

  it("ignore le montant envoye par le client et applique le tarif de l'evenement", async () => {
    const { POST } = await import("@/app/api/events/[slug]/participants/route");

    const res = await POST(makeRequest({ ...validBody, montant: 0, statut: "confirme" }), params);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.montant).toBe(10_000);
    expect(json.data.statut).toBe("pending");
  });

  it("numerote a la suite du dernier ticket de l'evenement", async () => {
    withTransaction({ taken: 1, maxTicket: 7 });
    const { POST } = await import("@/app/api/events/[slug]/participants/route");

    const res = await POST(makeRequest(validBody), params);
    const json = await res.json();

    expect(json.data.ticketNumber).toBe(8);
  });

  it("refuse une photo qui depasse la limite de taille", async () => {
    const huge = `data:image/png;base64,${"A".repeat(8_000_000)}`;
    const { POST } = await import("@/app/api/events/[slug]/participants/route");

    const res = await POST(makeRequest({ ...validBody, photo: huge }), params);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/volumineuse/i);
  });

  it("confirme directement une inscription gratuite", async () => {
    prismaMock.event.findUnique.mockResolvedValue({
      ...baseEvent,
      badgePayant: false,
      prixBadge: 0,
    });
    const { POST } = await import("@/app/api/events/[slug]/participants/route");

    const res = await POST(makeRequest(validBody), params);
    const json = await res.json();

    expect(json.data.montant).toBe(0);
    expect(json.data.statut).toBe("confirme");
  });
});
