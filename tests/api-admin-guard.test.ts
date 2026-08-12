// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Garde-fous du back-office : chaque route admin doit exiger les bons
 * rôles. On vérifie ici que le refus de `requireRole` est bien propagé
 * plutôt que contourné.
 */

const prismaMock = {
  participant: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
  event: { findMany: vi.fn(), count: vi.fn() },
  adminUser: { findMany: vi.fn(), create: vi.fn() },
  commande: { findMany: vi.fn(), count: vi.fn() },
};

const requireRole = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/admin-auth", () => ({ requireRole, requireAnyAdmin: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn().mockResolvedValue(null) }));

const forbidden = () =>
  NextResponse.json({ error: "Accès refusé" }, { status: 403 });

function req(url = "http://localhost/api/admin/x"): NextRequest {
  return new Request(url, { method: "POST" }) as unknown as NextRequest;
}

describe("controle des roles sur les routes admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuse la liste des voyageurs a un role insuffisant", async () => {
    requireRole.mockResolvedValue({ session: null, error: forbidden() });
    const { GET } = await import("@/app/api/admin/voyageurs/route");

    const res = await GET(req("http://localhost/api/admin/voyageurs"));

    expect(res.status).toBe(403);
    expect(requireRole).toHaveBeenCalledWith("ADMIN", "SUPERVISEUR");
    expect(prismaMock.commande.findMany).not.toHaveBeenCalled();
  });

  it("refuse les statistiques a un role insuffisant", async () => {
    requireRole.mockResolvedValue({ session: null, error: forbidden() });
    const { GET } = await import("@/app/api/admin/stats/route");

    const res = await GET();

    expect(res.status).toBe(403);
    expect(requireRole).toHaveBeenCalledWith("ADMIN", "SUPERVISEUR");
  });

  it("refuse l'anonymisation a un role insuffisant", async () => {
    requireRole.mockResolvedValue({ session: null, error: forbidden() });
    const { POST } = await import("@/app/api/admin/participants/[ref]/anonymize/route");

    const res = await POST(req(), { params: Promise.resolve({ ref: "AIKO-1" }) });

    expect(res.status).toBe(403);
    expect(prismaMock.participant.update).not.toHaveBeenCalled();
  });

  it("anonymise quand le role est suffisant", async () => {
    requireRole.mockResolvedValue({ session: { user: { id: "u1", role: "ADMIN" } }, error: null });
    prismaMock.participant.findUnique.mockResolvedValue({ id: "p1", email: "a@b.com" });
    prismaMock.participant.update.mockResolvedValue({});
    const { POST } = await import("@/app/api/admin/participants/[ref]/anonymize/route");

    const res = await POST(req(), { params: Promise.resolve({ ref: "AIKO-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.participant.update).toHaveBeenCalled();
  });

  it("signale une inscription introuvable ou deja anonymisee", async () => {
    requireRole.mockResolvedValue({ session: { user: { id: "u1", role: "ADMIN" } }, error: null });
    prismaMock.participant.findUnique.mockResolvedValue(null);
    const { POST } = await import("@/app/api/admin/participants/[ref]/anonymize/route");

    const res = await POST(req(), { params: Promise.resolve({ ref: "AIKO-INCONNU" }) });

    expect(res.status).toBe(404);
  });
});
