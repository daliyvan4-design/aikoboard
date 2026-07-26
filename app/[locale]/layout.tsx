import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/lib/i18n-routing";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "../globals.css";

const META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "AIKO Board · Créez, participez, badgez — Événementiel Afrique",
    description:
      "Plateforme tout-en-un pour créer et gérer vos événements en Afrique de l'Ouest. Badges, tickets, QR codes, hébergement et conciergerie.",
  },
  en: {
    title: "AIKO Board · Create, attend, badge — African Events Platform",
    description:
      "All-in-one platform to create and manage your West African events. Badges, tickets, QR codes, accommodation and concierge.",
  },
  ar: {
    title: "AIKO Board · أنشئ وشارك — منصة الفعاليات الأفريقية",
    description: "منصة شاملة لإنشاء وإدارة فعالياتكم في غرب أفريقيا",
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
    title: { default: m.title, template: "%s · AIKO Board" },
    description: m.description,
    openGraph: {
      title: m.title,
      description: m.description,
      siteName: "AIKO Board",
      url: `https://aikoboard.com/${locale}`,
      type: "website",
    },
    alternates: {
      canonical: `https://aikoboard.com/${locale}`,
      languages: { fr: "/fr", en: "/en", ar: "/ar" },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="min-h-[calc(100vh-68px)]">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
