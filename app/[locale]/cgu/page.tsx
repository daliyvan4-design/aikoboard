import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: "CGU de la plateforme AIKO Board — Conditions d'utilisation du service.",
};

export default function CGUPage() {
  return (
    <section className="animate-fade-up">
      <div className="max-w-3xl mx-auto px-5 lg:px-10 pt-16 lg:pt-24 pb-24">
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-mute mb-8">
          <span className="w-2 h-2 rounded-full bg-gold" />
          <span>Juridique</span>
        </div>
        <h1 className="font-serif text-[36px] sm:text-[48px] leading-tight text-ink mb-4">
          Conditions générales d&apos;utilisation
        </h1>
        <p className="text-mute text-[13px] mb-12">Dernière mise à jour : juillet 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-ink3/80">
          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">1. Objet</h2>
            <p>
              Les présentes conditions générales d&apos;utilisation (CGU) définissent les
              modalités d&apos;accès et d&apos;utilisation de la plateforme AIKO Board, accessible à
              l&apos;adresse aikoboard.com. En accédant au site, l&apos;utilisateur accepte sans
              réserve les présentes CGU.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">2. Description du service</h2>
            <p>
              AIKO Board est une plateforme de gestion événementielle qui permet de créer des
              événements, gérer les inscriptions, émettre des badges et tickets avec QR code,
              et organiser l&apos;hébergement des participants via un réseau de résidences
              partenaires en Afrique de l&apos;Ouest.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">3. Inscription et compte</h2>
            <p>
              L&apos;accès aux fonctionnalités d&apos;organisation d&apos;événements nécessite la
              création d&apos;un compte administrateur. L&apos;utilisateur s&apos;engage à fournir des
              informations exactes et à maintenir la confidentialité de ses identifiants.
              Tout usage du compte est réputé fait par le titulaire.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">4. Tarification et paiements</h2>
            <p>
              Les paiements sont traités via GeniusPay, notre prestataire de paiement
              agréé. Les prix sont affichés en Francs CFA (XOF). Les frais de transaction
              sont à la charge de l&apos;organisateur sauf mention contraire. Les remboursements
              sont soumis aux conditions de l&apos;organisateur de l&apos;événement.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">5. Obligations de l&apos;utilisateur</h2>
            <p>L&apos;utilisateur s&apos;engage à :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Ne pas utiliser le service à des fins illicites</li>
              <li>Ne pas tenter d&apos;accéder aux données d&apos;autres utilisateurs</li>
              <li>Ne pas perturber le fonctionnement de la plateforme</li>
              <li>Respecter les droits de propriété intellectuelle</li>
              <li>Fournir des informations véridiques lors de l&apos;inscription</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">6. Responsabilité</h2>
            <p>
              AIKO Board met tout en œuvre pour assurer la disponibilité et le bon
              fonctionnement de la plateforme. Toutefois, AIKO Board ne peut être tenu
              responsable des interruptions temporaires liées à la maintenance, aux mises
              à jour ou à des cas de force majeure.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">7. Modification des CGU</h2>
            <p>
              AIKO Board se réserve le droit de modifier les présentes CGU à tout moment.
              Les modifications entrent en vigueur dès leur publication sur le site.
              L&apos;utilisateur est invité à consulter régulièrement cette page.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">8. Droit applicable</h2>
            <p>
              Les présentes CGU sont régies par le droit ivoirien. Tout litige relatif à
              leur interprétation ou exécution relève de la compétence exclusive des
              tribunaux d&apos;Abidjan, Côte d&apos;Ivoire.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">9. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, vous pouvez nous contacter
              à l&apos;adresse : <strong>contact@aikoboard.com</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
