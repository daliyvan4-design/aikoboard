import { randomBytes } from "crypto";
import { prisma } from "./prisma";

/**
 * L'adresse d'un événement se lit dans son nom.
 *
 * Un événement renommé change donc de slug — mais l'ancien continue de
 * fonctionner : il est conservé dans `slugAliases` et redirige vers la
 * nouvelle adresse. Sans cela, chaque renommage casserait les liens déjà
 * partagés, les résultats Google et le lien du QR code d'inscription.
 */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

/** Un slug déjà pris (ou réservé par un alias) reçoit un suffixe. */
export async function uniqueSlug(base: string, excludeEventId?: string): Promise<string> {
  const fallback = base || "evenement";

  const isTaken = async (candidate: string): Promise<boolean> => {
    const existing = await prisma.event.findFirst({
      where: {
        OR: [{ slug: candidate }, { slugAliases: { has: candidate } }],
        ...(excludeEventId ? { NOT: { id: excludeEventId } } : {}),
      },
      select: { id: true },
    });
    return existing !== null;
  };

  if (!(await isTaken(fallback))) return fallback;

  for (let i = 2; i <= 50; i++) {
    const candidate = `${fallback}-${i}`;
    if (!(await isTaken(candidate))) return candidate;
  }

  return `${fallback}-${randomBytes(3).toString("hex")}`;
}

/**
 * Retrouve un événement par son slug courant ou par un ancien slug.
 * `canonicalSlug` indique l'adresse à afficher.
 */
export async function resolveEventSlug(
  slug: string,
): Promise<{ id: string; canonicalSlug: string; isAlias: boolean } | null> {
  const event = await prisma.event.findFirst({
    where: { OR: [{ slug }, { slugAliases: { has: slug } }] },
    select: { id: true, slug: true },
  });

  if (!event) return null;
  return { id: event.id, canonicalSlug: event.slug, isAlias: event.slug !== slug };
}
