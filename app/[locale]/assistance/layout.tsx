import type { Metadata } from "next";

const META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Assistance · AIKO Board — Centre d'aide",
    description:
      "Besoin d'aide ? FAQ, support par email et WhatsApp. L'équipe AIKO Board vous accompagne pour vos événements.",
  },
  en: {
    title: "Support · AIKO Board — Help Center",
    description:
      "Need help? FAQ, email and WhatsApp support. The AIKO Board team is here for your events.",
  },
  ar: {
    title: "المساعدة · AIKO Board",
    description: "هل تحتاج مساعدة؟ الأسئلة الشائعة والدعم عبر البريد الإلكتروني وواتساب",
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
      url: `https://aikoboard.com/${locale}/assistance`,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
