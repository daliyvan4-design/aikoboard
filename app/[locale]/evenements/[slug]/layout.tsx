import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveEventSlug } from "@/lib/slug";

const BASE = "https://aikoboard.com";

// Sans cela, Next prerend la coquille de la page : le statut 200 part
// avant que le layout ait fini, et redirection comme 404 arrivent trop
// tard pour changer la reponse HTTP.
export const dynamic = "force-dynamic";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Métadonnées propres à chaque événement : le titre de l'onglet et le
 * partage sur les réseaux affichent le nom de l'événement, pas un libellé
 * générique.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  const event = await prisma.event.findFirst({
    where: { OR: [{ slug }, { slugAliases: { has: slug } }] },
    select: { slug: true, nom: true, description: true, lieu: true, ville: true, coverUrl: true },
  });

  if (!event) return {};

  const description =
    event.description?.slice(0, 160) ||
    `${event.nom} — ${event.lieu}, ${event.ville}. Inscrivez-vous et recevez votre badge ou ticket avec QR code.`;
  const url = `${BASE}/${locale}/evenements/${event.slug}`;

  return {
    title: `${event.nom} · AIKO Board`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: event.nom,
      description,
      url,
      ...(event.coverUrl ? { images: [event.coverUrl] } : {}),
    },
  };
}

export default async function EventLayout({ children, params }: Props) {
  const { locale, slug } = await params;

  // Evenement renomme : l'ancienne adresse redirige en 308 vers la
  // nouvelle, pour les visiteurs comme pour les moteurs de recherche.
  const resolved = await resolveEventSlug(slug);

  // Evenement supprime : un 404 franc, plutot qu'une page vide en 200 que
  // Google garderait dans son index.
  if (!resolved) notFound();

  if (resolved.isAlias) {
    permanentRedirect(`/${locale}/evenements/${resolved.canonicalSlug}`);
  }

  return children;
}
