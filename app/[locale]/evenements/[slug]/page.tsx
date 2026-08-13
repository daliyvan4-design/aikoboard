import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveEventSlug } from "@/lib/slug";
import EventClient from "./event-client";

const BASE = "https://aikoboard.com";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Métadonnées propres à chaque événement : l'onglet du navigateur et le
 * partage sur les réseaux affichent le nom de l'événement, pas un libellé
 * générique.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  const event = await prisma.event.findFirst({
    where: { OR: [{ slug }, { slugAliases: { has: slug } }] },
    select: { slug: true, nom: true, description: true, lieu: true, ville: true, coverUrl: true },
  });

  if (!event) return { title: "Evenement introuvable · AIKO Board" };

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

/**
 * Le contrôle vit dans la page, et non dans le layout : `notFound()` et
 * `permanentRedirect()` n'agissent sur le statut HTTP que depuis une page.
 */
export default async function EventPage({ params }: Props) {
  const { locale, slug } = await params;

  const resolved = await resolveEventSlug(slug);

  // Evenement supprime ou adresse inventee : un 404 franc, plutot qu'une
  // page vide en 200 que Google conserverait dans son index.
  if (!resolved) notFound();

  // Evenement renomme : l'ancienne adresse redirige vers la nouvelle.
  if (resolved.isAlias) {
    permanentRedirect(`/${locale}/evenements/${resolved.canonicalSlug}`);
  }

  return <EventClient />;
}
