import type { Metadata } from "next";

const META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Salon AIKO 2026 · Événementiel & Hospitalité en Afrique",
    description:
      "Le rendez-vous annuel des professionnels de l'événementiel et de l'hospitalité en Afrique de l'Ouest. Programme, intervenants et inscriptions.",
  },
  en: {
    title: "AIKO Expo 2026 · Events & Hospitality in Africa",
    description:
      "The annual gathering for event and hospitality professionals in West Africa. Programme, speakers and registration.",
  },
  ar: {
    title: "معرض AIKO 2026 · الفعاليات والضيافة في أفريقيا",
    description: "الملتقى السنوي لمحترفي الفعاليات والضيافة في غرب أفريقيا",
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
      url: `https://aikoboard.com/${locale}/salon`,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
