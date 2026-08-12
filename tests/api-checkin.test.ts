// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const prismaMock = {
  event: { findUnique: vi.fn() },
  participant: { findUnique: vi.fn(), update: vi.fn() },
};

const requireAnyAdmin = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/admin-auth", () => ({ requireAnyAdmin, requireRole: vi.fn() }));

const TOKEN = "a".repeat(64);

const event = {
  id: "evt_1",
  slug: "avca-2026",
  nom: "AVCA 2026",
  type: "conference",
  statut: "actif",
  manageToken: TOKEN,
  dateDebut: new Date("2026-09-01"),
  dateFin: new Date("2026-09-03"),
  lieu: "Sofitel",
  ville: "Abidjan",
  organisateur: "AIKO",
};

const participant = {
  eventId: "evt_1",
  reference: "AIKO-DEADBEEF",
  ticketNumber: 12,
  prenom: "Amadou",
  nom: "Diallo",
  email: "amadou@example.com",
  organisation: "AIKO",
  titre: null,
  photoUrl: null,
  type: "badge",
  statut: "confirme",
  checkedIn: false,
  checkedInAt: null,
  event,
};

function makeRequest(query = ""): NextRequest {
  const url = `http://localhost/api/participants/AIKO-DEADBEEF/checkin${query}`;
  const req = new Request(url, { method: "POST" }) as unknown as NextRequest;
  // Le route handler lit req.nextUrl.searchParams
  Object.defineProperty(req, "nextUrl", { value: new URL(url), writable: false });
  return req;
}

const params = { params: Promise.resolve({ ref: "AIKO-DEADBEEF" }) };

describe("POST /api/participants/[ref]/checkin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.event.findUnique.mockResolvedValue(event);
    prismaMock.participant.findUnique.mockResolvedValue(participant);
    prismaMock.participant.update.mockResolvedValue({
      ...participant,
      checkedIn: true,
      checkedInAt: new Date(),
    });
    requireAnyAdmin.mockResolvedValue({
      session: null,
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    });
  });

  it("refuse sans token ni session admin", async () => {
    const { POST } = await import("@/app/api/participants/[ref]/checkin/route");

    const res = await POST(makeRequest(), params);

    expect(res.status).toBe(401);
    expect(prismaMock.participant.findUnique).not.toHaveBeenCalled();
  });

  it("laisse l'organisateur scanner avec son token de gestion", async () => {
    const { POST } = await import("@/app/api/participants/[ref]/checkin/route");

    const res = await POST(makeRequest(`?token=${TOKEN}&slug=avca-2026`), params);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.ticketNumber).toBe(12);
    // L'organisateur n'a pas eu besoin d'une session admin
    expect(requireAnyAdmin).not.toHaveBeenCalled();
  });

  it("refuse un token de gestion invalide", async () => {
    const { POST } = await import("@/app/api/participants/[ref]/checkin/route");

    const res = await POST(makeRequest(`?token=${"b".repeat(64)}&slug=avca-2026`), params);

    expect(res.status).toBe(403);
    expect(prismaMock.participant.findUnique).not.toHaveBeenCalled();
  });

  it("refuse le badge d'un autre evenement", async () => {
    prismaMock.participant.findUnique.mockResolvedValue({
      ...participant,
      eventId: "evt_autre",
    });
    const { POST } = await import("@/app/api/participants/[ref]/checkin/route");

    const res = await POST(makeRequest(`?token=${TOKEN}&slug=avca-2026`), params);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("WRONG_EVENT");
    expect(prismaMock.participant.update).not.toHaveBeenCalled();
  });

  it("accepte une session admin sans token", async () => {
    requireAnyAdmin.mockResolvedValue({ session: { user: { role: "ADMIN" } }, error: null });
    const { POST } = await import("@/app/api/participants/[ref]/checkin/route");

    const res = await POST(makeRequest(), params);

    expect(res.status).toBe(200);
  });

  it("signale un badge deja scanne", async () => {
    prismaMock.participant.findUnique.mockResolvedValue({
      ...participant,
      checkedIn: true,
      checkedInAt: new Date("2026-09-01T09:00:00Z"),
    });
    const { POST } = await import("@/app/api/participants/[ref]/checkin/route");

    const res = await POST(makeRequest(`?token=${TOKEN}&slug=avca-2026`), params);
    const json = await res.json();

    expect(json.code).toBe("ALREADY_CHECKED_IN");
    expect(prismaMock.participant.update).not.toHaveBeenCalled();
  });
});
