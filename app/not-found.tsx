import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="fr">
      <body className="bg-[#0A0A0A] text-white font-sans antialiased">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <p className="text-[#C8A951] font-mono text-[14px] tracking-widest mb-4">404</p>
            <h1 className="font-serif text-[48px] leading-tight mb-4">
              Page introuvable
            </h1>
            <p className="text-white/50 text-[15px] leading-relaxed mb-8">
              La page que vous cherchez n&apos;existe pas ou a été déplacée.
            </p>
            <Link
              href="/fr"
              className="inline-block bg-[#C8A951] hover:bg-[#B89A41] text-[#0A0A0A] font-semibold rounded-full px-8 py-3 text-[14px] transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
