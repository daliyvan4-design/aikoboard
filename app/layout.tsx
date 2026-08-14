import type { Metadata, Viewport } from "next";
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
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // iOS ignore le manifeste : c'est ce fichier qu'il utilise sur l'ecran
    // d'accueil, et il arrondit les coins lui-meme.
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Ouverture en plein ecran depuis l'ecran d'accueil iOS, barre d'etat
  // accordee au fond encre de l'application.
  appleWebApp: {
    capable: true,
    title: "AIKO Board",
    statusBarStyle: "black-translucent",
  },
  metadataBase: new URL("https://aikoboard.com"),
  openGraph: {
    title: "AIKO Board",
    description: "Créez, participez, badgez — la plateforme événementielle tout-en-un",
    siteName: "AIKO Board",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  // Laisse l'application occuper l'encoche en mode plein ecran
  viewportFit: "cover",
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
