// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = {
  residence: { findMany: vi.fn(), findFirst: vi.fn() },
  residenceTarif: { findFirst: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

describe("hebergements d un evenement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ne retient que les residences actives du parc", async () => {
    prismaMock.residence.findMany.mockResolvedValue([{ id: "r1" }, { id: "r3" }]);
    const { sanitizeResidenceIds } = await import("@/lib/event-residences");

    // r2 est inconnue ou desactivee : elle disparait du pack
    expect(await sanitizeResidenceIds(["r1", "r2", "r3"])).toEqual(["r1", "r3"]);
  });

  it("ignore les valeurs qui ne sont pas des identifiants", async () => {
    prismaMock.residence.findMany.mockResolvedValue([{ id: "r1" }]);
    const { sanitizeResidenceIds } = await import("@/lib/event-residences");

    await sanitizeResidenceIds(["r1", 7, null, { id: "r9" }]);

    expect(prismaMock.residence.findMany.mock.calls[0][0].where.id.in).toEqual(["r1"]);
  });

  it("refuse une residence absente du pack de l evenement", async () => {
    const { resolveStayChoice } = await import("@/lib/event-residences");
    prismaMock.residenceTarif.findFirst.mockResolvedValue(null);

    expect(await resolveStayChoice(["r1"], "r2", null)).toEqual({
      residenceId: null,
      residenceTarifId: null,
    });
    expect(prismaMock.residence.findFirst).not.toHaveBeenCalled();
  });

  it("refuse une chambre qui appartient a une autre residence", async () => {
    prismaMock.residence.findFirst.mockResolvedValue({
      id: "r1",
      tarifs: [{ id: "t1" }],
    });
    const { resolveStayChoice } = await import("@/lib/event-residences");

    // t99 est le tarif d un autre hotel : la residence reste, pas le prix
    expect(await resolveStayChoice(["r1"], "r1", "t99")).toEqual({
      residenceId: "r1",
      residenceTarifId: null,
    });
  });

  it("accepte la residence et sa chambre", async () => {
    prismaMock.residence.findFirst.mockResolvedValue({
      id: "r1",
      tarifs: [{ id: "t1" }, { id: "t2" }],
    });
    const { resolveStayChoice } = await import("@/lib/event-residences");

    expect(await resolveStayChoice(["r1", "r2"], "r1", "t2")).toEqual({
      residenceId: "r1",
      residenceTarifId: "t2",
    });
  });

  it("retrouve la residence a partir de la seule chambre envoyee", async () => {
    // Ancien parcours : le formulaire n envoie que residenceTarifId
    prismaMock.residenceTarif.findFirst.mockResolvedValue({ residenceId: "r1" });
    prismaMock.residence.findFirst.mockResolvedValue({ id: "r1", tarifs: [{ id: "t1" }] });
    const { resolveStayChoice } = await import("@/lib/event-residences");

    expect(await resolveStayChoice(["r1"], undefined, "t1")).toEqual({
      residenceId: "r1",
      residenceTarifId: "t1",
    });
  });

  it("garde une residence sans tarif : l equipe la chiffrera", async () => {
    prismaMock.residence.findFirst.mockResolvedValue({ id: "r1", tarifs: [] });
    const { resolveStayChoice } = await import("@/lib/event-residences");

    expect(await resolveStayChoice(["r1"], "r1", null)).toEqual({
      residenceId: "r1",
      residenceTarifId: null,
    });
  });

  it("ne consulte pas la base quand l evenement ne propose rien", async () => {
    const { resolveStayChoice } = await import("@/lib/event-residences");

    expect(await resolveStayChoice([], "r1", "t1")).toEqual({
      residenceId: null,
      residenceTarifId: null,
    });
    expect(prismaMock.residenceTarif.findFirst).not.toHaveBeenCalled();
  });
});
