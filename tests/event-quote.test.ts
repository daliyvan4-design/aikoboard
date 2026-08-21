// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = {
  service: { findMany: vi.fn() },
  residence: { findUnique: vi.fn() },
  commande: { create: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const NUIT = { id: "s-hotel", unite: "nuit", prixBase: 129_000, tarifs: [] };
const COURSE = { id: "s-berline", unite: "course", prixBase: 59_000, tarifs: [] };
const PAX = { id: "s-repas", unite: "pax", prixBase: 13_000, tarifs: [] };

const base = {
  participantId: "p1",
  prenom: "Amadou",
  nom: "Diallo",
  email: "amadou@example.com",
  telephone: "+2250700000000",
  dateArrivee: new Date("2026-09-15"),
  dateDepart: new Date("2026-09-18"),
  nombrePersonnes: 2,
};

describe("devis de conciergerie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.commande.create.mockImplementation(({ data }: { data: { montantTotal: number } }) => ({
      reference: "AIKO-DEVIS01",
      montantTotal: data.montantTotal,
    }));
  });

  it("compte les nuits entre l arrivee et le depart", async () => {
    const { countNights } = await import("@/lib/event-quote");

    expect(countNights(new Date("2026-09-15"), new Date("2026-09-18"))).toBe(3);
    // Un sejour d une journee compte quand meme pour une nuit
    expect(countNights(new Date("2026-09-15"), new Date("2026-09-15"))).toBe(1);
  });

  it("deduit la quantite de l unite de facturation", async () => {
    const { suggestQuantity } = await import("@/lib/event-quote");

    expect(suggestQuantity("nuit", 3, 2)).toBe(3);
    expect(suggestQuantity("personne", 3, 2)).toBe(2);
    // Un repas par personne et par jour de presence
    expect(suggestQuantity("pax", 3, 2)).toBe(8);
    // Une course, une mission, une seance se commandent a l unite
    expect(suggestQuantity("course", 3, 2)).toBe(1);
    expect(suggestQuantity("mission", 3, 2)).toBe(1);
  });

  it("chiffre le devis a partir des unites du catalogue", async () => {
    prismaMock.service.findMany.mockResolvedValue([NUIT, COURSE]);
    const { createQuoteFromRegistration } = await import("@/lib/event-quote");

    const quote = await createQuoteFromRegistration({
      ...base,
      serviceIds: ["s-hotel", "s-berline"],
    });

    // 3 nuits x 129 000 + 1 course x 59 000
    expect(quote?.montantTotal).toBe(3 * 129_000 + 59_000);
    const data = prismaMock.commande.create.mock.calls[0][0].data;
    expect(data.statut).toBe("EN_ATTENTE");
    expect(data.participantId).toBe("p1");
    expect(data.lignes.create).toHaveLength(2);
  });

  it("multiplie les repas par le nombre de personnes", async () => {
    prismaMock.service.findMany.mockResolvedValue([PAX]);
    const { createQuoteFromRegistration } = await import("@/lib/event-quote");

    const quote = await createQuoteFromRegistration({ ...base, serviceIds: ["s-repas"] });

    // 2 personnes x 4 jours x 13 000
    expect(quote?.montantTotal).toBe(2 * 4 * 13_000);
  });

  it("ne cree rien quand aucun service n est demande", async () => {
    const { createQuoteFromRegistration } = await import("@/lib/event-quote");

    expect(await createQuoteFromRegistration({ ...base, serviceIds: [] })).toBeNull();
    expect(prismaMock.commande.create).not.toHaveBeenCalled();
  });

  it("facture la chambre choisie a la nuit, au prix du parc", async () => {
    prismaMock.service.findMany.mockResolvedValue([]);
    prismaMock.residence.findUnique.mockResolvedValue({
      nom: "Byblos Hotel",
      quartier: "Marcory",
      ville: "Abidjan",
      tarifs: [
        { id: "t-std", label: "Standard", typeChambre: "double", prixParNuit: 65_000 },
        { id: "t-suite", label: "Suite", typeChambre: "suite", prixParNuit: 120_000 },
      ],
    });
    const { createQuoteFromRegistration } = await import("@/lib/event-quote");

    const devis = await createQuoteFromRegistration({
      ...base,
      serviceIds: [],
      residenceId: "r-byblos",
      residenceTarifId: "t-suite",
    });

    // 3 nuits x 120 000 : le nombre de personnes ne multiplie pas la chambre
    expect(devis?.montantTotal).toBe(360_000);
    const ligne = prismaMock.commande.create.mock.calls[0][0].data.lignes.create[0];
    expect(ligne).toMatchObject({ residenceTarifId: "t-suite", quantite: 3, prixUnitaire: 120_000 });
    expect(ligne.serviceId).toBeUndefined();
  });

  it("garde au devis une residence sans tarif, a chiffrer par l equipe", async () => {
    prismaMock.service.findMany.mockResolvedValue([]);
    prismaMock.residence.findUnique.mockResolvedValue({
      nom: "Villa Ayaba",
      quartier: "Marcory",
      ville: "Abidjan",
      tarifs: [],
    });
    const { createQuoteFromRegistration } = await import("@/lib/event-quote");

    const devis = await createQuoteFromRegistration({
      ...base,
      serviceIds: [],
      residenceId: "r-ayaba",
      residenceTarifId: null,
    });

    expect(devis?.montantTotal).toBe(0);
    const data = prismaMock.commande.create.mock.calls[0][0].data;
    expect(data.notes).toContain("Villa Ayaba");
    expect(data.lignes.create).toHaveLength(0);
  });

  it("n echoue jamais : une inscription reste valide si le devis casse", async () => {
    prismaMock.service.findMany.mockRejectedValue(new Error("base injoignable"));
    const { createQuoteFromRegistration } = await import("@/lib/event-quote");

    await expect(
      createQuoteFromRegistration({ ...base, serviceIds: ["s-hotel"] }),
    ).resolves.toBeNull();
  });
});

describe("nationalité", () => {
  it("reconnaît un code pays valide et rejette le reste", async () => {
    const { isKnownCountry, countryName } = await import("@/lib/countries");

    expect(isKnownCountry("CI")).toBe(true);
    expect(isKnownCountry("ZZ")).toBe(false);
    expect(isKnownCountry(42)).toBe(false);
    expect(countryName("SN")).toBe("Sénégal");
  });

  it("place les pays de la zone en tête de liste", async () => {
    const { COUNTRIES_PRIORITY, COUNTRIES } = await import("@/lib/countries");

    expect(COUNTRIES_PRIORITY[0].code).toBe("CI");
    expect(COUNTRIES.length).toBeGreaterThan(150);
  });
});
