import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site AIKO Board — Informations sur l'éditeur et l'hébergeur.",
};

export default function MentionsLegalesPage() {
  return (
    <section className="animate-fade-up">
      <div className="max-w-3xl mx-auto px-5 lg:px-10 pt-16 lg:pt-24 pb-24">
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-mute mb-8">
          <span className="w-2 h-2 rounded-full bg-gold" />
          <span>Juridique</span>
        </div>
        <h1 className="font-serif text-[36px] sm:text-[48px] leading-tight text-ink mb-12">
          Mentions légales
        </h1>

        <div className="prose-aiko space-y-8 text-[15px] leading-relaxed text-ink3/80">
          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">Éditeur du site</h2>
            <p>
              <strong>AIKO Board</strong><br />
              Plateforme de création et gestion d&apos;événements<br />
              Abidjan, Côte d&apos;Ivoire<br />
              Email : contact@aikoboard.com
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">Directeur de la publication</h2>
            <p>Le directeur de la publication est le représentant légal de la société AIKO Board.</p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">Hébergement</h2>
            <p>
              <strong>Vercel Inc.</strong><br />
              440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
              Site : vercel.com
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu du site AIKO Board (textes, images, logos, vidéos,
              graphismes, icônes) est protégé par le droit de la propriété intellectuelle.
              Toute reproduction, représentation ou diffusion, totale ou partielle, du contenu
              de ce site, par quelque procédé que ce soit, sans l&apos;autorisation expresse de
              l&apos;éditeur, est interdite.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">Responsabilité</h2>
            <p>
              AIKO Board s&apos;efforce de fournir des informations exactes et à jour. Toutefois,
              l&apos;éditeur ne peut garantir l&apos;exactitude, la complétude ou l&apos;actualité des
              informations diffusées sur ce site. L&apos;éditeur décline toute responsabilité pour
              les éventuelles erreurs ou omissions.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">Cookies</h2>
            <p>
              Le site utilise des cookies strictement nécessaires au fonctionnement de la
              plateforme (authentification, préférences de langue). Aucun cookie publicitaire
              ou de suivi n&apos;est utilisé.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
