import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  /**
   * Anciennes URL indexées par Google avant le renommage des routes
   * (/creer → /evenements/creer). Sans ces redirections permanentes, les
   * visiteurs venant des résultats de recherche tombent sur un 404 et
   * Google conserve la mauvaise adresse.
   */
  async redirects() {
    return [
      { source: "/creer", destination: "/fr/evenements/creer", permanent: true },
      {
        source: "/:locale(fr|en|ar)/creer",
        destination: "/:locale/evenements/creer",
        permanent: true,
      },
      // L'ancien /evenement/[id] utilisait des identifiants, pas les slugs
      // actuels : impossible de retrouver la fiche, on renvoie sur la liste.
      { source: "/evenement/:id", destination: "/fr/evenements", permanent: true },
      {
        source: "/:locale(fr|en|ar)/evenement/:id",
        destination: "/:locale/evenements",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
          { key: "X-XSS-Protection", value: "0" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
