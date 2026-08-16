// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = {
  service: { findMany: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

describe("services de conciergerie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ne retient que les services actifs du catalogue", async () => {
    prismaMock.service.findMany.mockResolvedValue([{ id: "s1" }, { id: "s3" }]);
    const { sanitizeServiceIds } = await import("@/lib/event-services");

    // s2 est inconnu ou inactif, il disparait
    expect(await sanitizeServiceIds(["s1", "s2", "s3"])).toEqual(["s1", "s3"]);
  });

  it("ignore les valeurs qui ne sont pas des identifiants", async () => {
    prismaMock.service.findMany.mockResolvedValue([{ id: "s1" }]);
    const { sanitizeServiceIds } = await import("@/lib/event-services");

    await sanitizeServiceIds(["s1", 42, null, { id: "s9" }]);

    expect(prismaMock.service.findMany.mock.calls[0][0].where.id.in).toEqual(["s1"]);
  });

  it("dedoublonne et plafonne la liste", async () => {
    prismaMock.service.findMany.mockResolvedValue([]);
    const { sanitizeServiceIds } = await import("@/lib/event-services");

    await sanitizeServiceIds([...Array(60)].map((_, i) => `s${i % 45}`));

    expect(prismaMock.service.findMany.mock.calls[0][0].where.id.in).toHaveLength(40);
  });

  it("ne touche pas la base quand rien n est demande", async () => {
    const { sanitizeServiceIds } = await import("@/lib/event-services");

    expect(await sanitizeServiceIds([])).toEqual([]);
    expect(await sanitizeServiceIds(undefined)).toEqual([]);
    expect(prismaMock.service.findMany).not.toHaveBeenCalled();
  });

  it("limite le participant aux services du pack de l evenement", async () => {
    const { intersectWithPack } = await import("@/lib/event-services");

    // s9 n est pas dans le pack : le participant ne peut pas se l offrir
    expect(intersectWithPack(["s1", "s9", "s2"], ["s1", "s2", "s3"])).toEqual(["s1", "s2"]);
  });

  it("renvoie une liste vide quand l evenement ne propose rien", async () => {
    const { intersectWithPack } = await import("@/lib/event-services");

    expect(intersectWithPack(["s1"], [])).toEqual([]);
  });

  it("dedoublonne les demandes du participant", async () => {
    const { intersectWithPack } = await import("@/lib/event-services");

    expect(intersectWithPack(["s1", "s1", "s2"], ["s1", "s2"])).toEqual(["s1", "s2"]);
  });

  it("charge le detail des services dans l ordre du catalogue", async () => {
    prismaMock.service.findMany.mockResolvedValue([
      { id: "s1", nom: "Berline avec chauffeur", categorie: "transport" },
    ]);
    const { loadServices } = await import("@/lib/event-services");

    const services = await loadServices(["s1"]);

    expect(services).toHaveLength(1);
    expect(prismaMock.service.findMany.mock.calls[0][0].orderBy).toEqual([
      { categorie: "asc" },
      { ordre: "asc" },
    ]);
  });
});
