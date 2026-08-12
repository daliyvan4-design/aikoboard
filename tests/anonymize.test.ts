// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = {
  participant: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

describe("anonymisation RGPD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.participant.update.mockResolvedValue({});
  });

  it("place la limite de conservation 12 mois en arriere", async () => {
    const { retentionCutoff, RETENTION_MONTHS } = await import("@/lib/anonymize");
    const cutoff = retentionCutoff(new Date("2026-08-12T00:00:00Z"));

    expect(RETENTION_MONTHS).toBe(12);
    expect(cutoff.getFullYear()).toBe(2025);
    expect(cutoff.getMonth()).toBe(7); // aout
  });

  it("reconnait une inscription deja anonymisee", async () => {
    const { isAnonymized } = await import("@/lib/anonymize");

    expect(isAnonymized("cm123@anonymise.invalid")).toBe(true);
    expect(isAnonymized("amadou@example.com")).toBe(false);
  });

  it("efface les donnees identifiantes mais garde la ligne", async () => {
    prismaMock.participant.findUnique.mockResolvedValue({
      id: "p1",
      email: "amadou@example.com",
    });
    const { anonymizeParticipant } = await import("@/lib/anonymize");

    const done = await anonymizeParticipant("AIKO-1");

    expect(done).toBe(true);
    const data = prismaMock.participant.update.mock.calls[0][0].data;
    expect(data.email).toBe("p1@anonymise.invalid");
    expect(data.telephone).toBe("");
    expect(data.photoUrl).toBeNull();
    expect(data.organisation).toBeNull();
    // Rien qui touche a la comptabilite ni au billet
    expect(data).not.toHaveProperty("montant");
    expect(data).not.toHaveProperty("ticketNumber");
    expect(data).not.toHaveProperty("checkedIn");
  });

  it("n'anonymise pas deux fois la meme inscription", async () => {
    prismaMock.participant.findUnique.mockResolvedValue({
      id: "p1",
      email: "p1@anonymise.invalid",
    });
    const { anonymizeParticipant } = await import("@/lib/anonymize");

    expect(await anonymizeParticipant("AIKO-1")).toBe(false);
    expect(prismaMock.participant.update).not.toHaveBeenCalled();
  });

  it("ne purge que les evenements termines depuis plus de 12 mois", async () => {
    prismaMock.participant.findMany.mockResolvedValue([{ id: "p1" }, { id: "p2" }]);
    const { anonymizeExpiredParticipants } = await import("@/lib/anonymize");

    const count = await anonymizeExpiredParticipants(new Date("2026-08-12T00:00:00Z"));

    expect(count).toBe(2);
    const where = prismaMock.participant.findMany.mock.calls[0][0].where;
    expect(where.event.dateFin.lt.getFullYear()).toBe(2025);
    expect(where.email.not.endsWith).toBe("@anonymise.invalid");
    expect(prismaMock.participant.update).toHaveBeenCalledTimes(2);
  });
});
