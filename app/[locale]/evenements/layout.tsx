import type { Metadata } from "next";

const META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Événements · AIKO Board — Conférences, concerts et salons",
    description:
      "Découvrez les événements à venir en Afrique de l'Ouest. Inscrivez-vous, obtenez votre badge ou ticket avec QR code.",
  },
  en: {
    title: "Events · AIKO Board — Conferences, concerts and expos",
    description:
      "Discover upcoming events in West Africa. Register, get your badge or ticket with QR code.",
  },
  ar: {
    title: "الفعاليات · AIKO Board",
    description: "اكتشف الفعاليات القادمة في غرب أفريقيا. سجل واحصل على شارتك أو تذكرتك",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale] || META.fr;
  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.title,
      description: m.description,
      url: `https://aikoboard.com/${locale}/evenements`,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
