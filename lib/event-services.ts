import { prisma } from "./prisma";

/**
 * Services de conciergerie attachés à un événement.
 *
 * Deux niveaux : l'organisateur compose le pack de son événement à partir
 * du catalogue, et le participant ne peut demander que ce qui s'y trouve.
 * Les deux listes sont validées contre la base — un identifiant inventé
 * dans la requête est simplement ignoré.
 */

export interface EventService {
  id: string;
  nom: string;
  description: string | null;
  categorie: string;
  prixBase: number;
  unite: string;
  icon: string | null;
}

export const SERVICE_CATEGORIES: Record<string, string> = {
  transport: "Transport",
  hebergement: "Hébergement",
  repas: "Restauration",
  extras: "Extras & conciergerie",
};

/** Ne conserve que les identifiants de services actifs, sans doublon. */
export async function sanitizeServiceIds(ids: unknown): Promise<string[]> {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const wanted = [...new Set(ids.filter((id): id is string => typeof id === "string"))].slice(0, 40);
  if (wanted.length === 0) return [];

  const found = await prisma.service.findMany({
    where: { id: { in: wanted }, actif: true },
    select: { id: true },
  });
  return found.map((s) => s.id);
}

/**
 * Services demandés par un participant : l'intersection de ce qu'il coche
 * et de ce que l'événement propose réellement.
 */
export function intersectWithPack(requested: unknown, pack: string[]): string[] {
  if (!Array.isArray(requested) || pack.length === 0) return [];
  const allowed = new Set(pack);
  return [...new Set(requested.filter((id): id is string => typeof id === "string" && allowed.has(id)))];
}

/** Détail des services d'un pack, dans l'ordre d'affichage du catalogue. */
export async function loadServices(ids: string[]): Promise<EventService[]> {
  if (ids.length === 0) return [];
  return prisma.service.findMany({
    where: { id: { in: ids }, actif: true },
    select: {
      id: true,
      nom: true,
      description: true,
      categorie: true,
      prixBase: true,
      unite: true,
      icon: true,
    },
    orderBy: [{ categorie: "asc" }, { ordre: "asc" }],
  });
}
