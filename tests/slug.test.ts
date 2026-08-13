// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = {
  event: { findFirst: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

describe("slugs d'evenement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("derive l'adresse du nom de l'evenement", async () => {
    const { slugify } = await import("@/lib/slug");

    expect(slugify("23rd Annual AVCA Conference & VC Summit")).toBe(
      "23rd-annual-avca-conference-vc-summit",
    );
    expect(slugify("Salon de l'Élevage — Abidjan 2026")).toBe("salon-de-l-elevage-abidjan-2026");
    expect(slugify("  Forum   Tech  ")).toBe("forum-tech");
  });

  it("tronque les noms tres longs", async () => {
    const { slugify } = await import("@/lib/slug");
    expect(slugify("a".repeat(200)).length).toBe(80);
  });

  it("garde le slug tel quel s'il est libre", async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);
    const { uniqueSlug } = await import("@/lib/slug");

    expect(await uniqueSlug("forum-tech")).toBe("forum-tech");
  });

  it("suffixe un slug deja pris, y compris par un alias", async () => {
    prismaMock.event.findFirst
      .mockResolvedValueOnce({ id: "e1" }) // forum-tech pris
      .mockResolvedValueOnce(null); // forum-tech-2 libre
    const { uniqueSlug } = await import("@/lib/slug");

    expect(await uniqueSlug("forum-tech")).toBe("forum-tech-2");
    const where = prismaMock.event.findFirst.mock.calls[0][0].where;
    expect(where.OR).toEqual([{ slug: "forum-tech" }, { slugAliases: { has: "forum-tech" } }]);
  });

  it("ne se bloque pas sur un nom vide", async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);
    const { uniqueSlug, slugify } = await import("@/lib/slug");

    expect(await uniqueSlug(slugify("!!!"))).toBe("evenement");
  });

  it("retrouve un evenement par son ancien slug et signale l'alias", async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: "e1", slug: "nouveau-nom" });
    const { resolveEventSlug } = await import("@/lib/slug");

    const resolved = await resolveEventSlug("ancien-nom");

    expect(resolved).toEqual({ id: "e1", canonicalSlug: "nouveau-nom", isAlias: true });
  });

  it("ne signale pas d'alias quand le slug est deja canonique", async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: "e1", slug: "nouveau-nom" });
    const { resolveEventSlug } = await import("@/lib/slug");

    const resolved = await resolveEventSlug("nouveau-nom");

    expect(resolved?.isAlias).toBe(false);
  });

  it("renvoie null pour un slug inconnu", async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);
    const { resolveEventSlug } = await import("@/lib/slug");

    expect(await resolveEventSlug("inconnu")).toBeNull();
  });
});
