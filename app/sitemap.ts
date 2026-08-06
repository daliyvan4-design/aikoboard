import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BASE = "https://aikoboard.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await prisma.event.findMany({
    where: { statut: "actif" },
    select: { slug: true, updatedAt: true },
  });

  const residences = await prisma.residence.findMany({
    where: { statut: "actif" },
    select: { id: true, updatedAt: true },
  });

  const staticPages = [
    { url: `${BASE}/fr`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${BASE}/en`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${BASE}/fr/residences`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${BASE}/fr/evenements`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${BASE}/en/evenements`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${BASE}/fr/services`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE}/fr/mentions-legales`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE}/fr/cgu`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE}/fr/confidentialite`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  const eventPages = events.flatMap((e) => [
    { url: `${BASE}/fr/evenements/${e.slug}`, lastModified: e.updatedAt, changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${BASE}/en/evenements/${e.slug}`, lastModified: e.updatedAt, changeFrequency: "daily" as const, priority: 0.7 },
  ]);

  const residencePages = residences.map((r) => ({
    url: `${BASE}/fr/residences/${r.id}`,
    lastModified: r.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...eventPages, ...residencePages];
}
