import type { Metadata } from "next";

const META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Services · AIKO Board — Conciergerie événementielle",
    description:
      "Conciergerie haut de gamme pour vos événements en Afrique de l'Ouest : accueil VIP, hébergement, transport et logistique clé en main.",
  },
  en: {
    title: "Services · AIKO Board — Event Concierge",
    description:
      "Premium concierge services for your West African events: VIP welcome, accommodation, transport and turnkey logistics.",
  },
  ar: {
    title: "الخدمات · AIKO Board",
    description: "خدمات الكونسيرج الراقية لفعالياتكم في غرب أفريقيا",
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
      url: `https://aikoboard.com/${locale}/services`,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
