import { prisma } from "./prisma";

/**
 * Hébergements d'un événement — les vraies résidences du parc.
 *
 * Le catalogue de conciergerie (`Service`) décrit des prestations : un
 * transfert, un repas, une carte SIM. Un hébergement, lui, a des photos,
 * des chambres et un prix par nuit qui varie selon la chambre : il vit
 * dans `Residence` / `ResidenceTarif`, géré dans /admin/residences.
 *
 * L'organisateur choisit les résidences qu'il propose, le participant en
 * retient une et sa chambre. Les deux niveaux sont revalidés en base : un
 * identifiant absent du parc, ou d'une autre résidence, est ignoré.
 */

export interface EventResidenceTarif {
  id: string;
  label: string;
  typeChambre: string;
  prixParNuit: number;
  devise: string;
  capacite: number;
}

export interface EventResidence {
  id: string;
  nom: string;
  type: string;
  description: string | null;
  adresse: string;
  ville: string;
  quartier: string | null;
  capacite: number;
  equipements: string | null;
  images: { id: string; url: string; legende: string | null }[];
  tarifs: EventResidenceTarif[];
}

/** Nombre de résidences qu'un pack peut contenir. */
const MAX_PACK = 40;

/** Photos embarquées dans la fiche publique : de quoi se décider, pas plus. */
const MAX_IMAGES = 8;

const RESIDENCE_SELECT = {
  id: true,
  nom: true,
  type: true,
  description: true,
  adresse: true,
  ville: true,
  quartier: true,
  capacite: true,
  equipements: true,
  images: {
    orderBy: { ordre: "asc" },
    take: MAX_IMAGES,
    select: { id: true, url: true, legende: true },
  },
  tarifs: {
    where: { actif: true },
    orderBy: { prixParNuit: "asc" },
    select: {
      id: true,
      label: true,
      typeChambre: true,
      prixParNuit: true,
      devise: true,
      capacite: true,
    },
  },
} as const;

/** Ne conserve que les identifiants de résidences actives, sans doublon. */
export async function sanitizeResidenceIds(ids: unknown): Promise<string[]> {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const wanted = [
    ...new Set(ids.filter((id): id is string => typeof id === "string")),
  ].slice(0, MAX_PACK);
  if (wanted.length === 0) return [];

  const found = await prisma.residence.findMany({
    where: { id: { in: wanted }, statut: "actif" },
    select: { id: true },
  });
  return found.map((r) => r.id);
}

/** Fiches complètes des hébergements proposés, photos et chambres comprises. */
export async function loadEventResidences(ids: string[]): Promise<EventResidence[]> {
  if (ids.length === 0) return [];
  return prisma.residence.findMany({
    where: { id: { in: ids }, statut: "actif" },
    select: RESIDENCE_SELECT,
    orderBy: { nom: "asc" },
  });
}

export interface StayChoice {
  residenceId: string | null;
  residenceTarifId: string | null;
}

/**
 * Hébergement retenu par un participant, validé contre le pack.
 *
 * La chambre doit appartenir à la résidence choisie : sans ce contrôle,
 * une requête forgée réserverait la suite d'un palace au tarif d'une
 * chambre standard ailleurs. Une résidence sans tarif reste choisissable
 * — l'équipe la chiffrera, c'est le principe du devis.
 */
export async function resolveStayChoice(
  pack: string[],
  residenceId: unknown,
  residenceTarifId: unknown,
): Promise<StayChoice> {
  const vide: StayChoice = { residenceId: null, residenceTarifId: null };
  if (pack.length === 0) return vide;

  let voulue = typeof residenceId === "string" && pack.includes(residenceId) ? residenceId : null;

  // Ancien parcours : l'evenement se tient dans une residence et le
  // formulaire n'envoie que la chambre. On remonte a l'adresse par le tarif.
  if (!voulue && typeof residenceTarifId === "string") {
    const parTarif = await prisma.residenceTarif.findFirst({
      where: { id: residenceTarifId, actif: true, residenceId: { in: pack } },
      select: { residenceId: true },
    });
    voulue = parTarif?.residenceId ?? null;
  }

  if (!voulue) return vide;

  const residence = await prisma.residence.findFirst({
    where: { id: voulue, statut: "actif" },
    select: { id: true, tarifs: { where: { actif: true }, select: { id: true } } },
  });
  if (!residence) return vide;

  const tarifValide =
    typeof residenceTarifId === "string" &&
    residence.tarifs.some((t) => t.id === residenceTarifId);

  return {
    residenceId: residence.id,
    residenceTarifId: tarifValide ? (residenceTarifId as string) : null,
  };
}
