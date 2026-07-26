import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIKO Board · Créez, participez, badgez",
  description:
    "AIKO Board — Plateforme de création et gestion d'événements. Badges, tickets et accréditations avec QR code.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  metadataBase: new URL("https://aikoboard.com"),
  openGraph: {
    title: "AIKO Board",
    description: "Créez, participez, badgez — la plateforme événementielle tout-en-un",
    siteName: "AIKO Board",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-cream text-ink3 font-sans antialiased">{children}</body>
    </html>
  );
}
