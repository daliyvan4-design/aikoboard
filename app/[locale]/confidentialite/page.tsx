import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité AIKO Board — Comment nous protégeons vos données personnelles.",
};

export default function ConfidentialitePage() {
  return (
    <section className="animate-fade-up">
      <div className="max-w-3xl mx-auto px-5 lg:px-10 pt-16 lg:pt-24 pb-24">
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-mute mb-8">
          <span className="w-2 h-2 rounded-full bg-gold" />
          <span>Confidentialité</span>
        </div>
        <h1 className="font-serif text-[36px] sm:text-[48px] leading-tight text-ink mb-4">
          Politique de confidentialité
        </h1>
        <p className="text-mute text-[13px] mb-12">Dernière mise à jour : juillet 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-ink3/80">
          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">1. Données collectées</h2>
            <p>Dans le cadre de l&apos;utilisation de la plateforme AIKO Board, nous collectons :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Données d&apos;identification :</strong> nom, prénom, email, téléphone</li>
              <li><strong>Données de participation :</strong> événements inscrits, badges, tickets, QR codes</li>
              <li><strong>Données de paiement :</strong> références de transaction (les données bancaires sont traitées par GeniusPay et ne transitent pas par nos serveurs)</li>
              <li><strong>Données de navigation :</strong> préférences de langue, cookies de session</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">2. Finalité du traitement</h2>
            <p>Les données collectées sont utilisées pour :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Gérer votre inscription aux événements</li>
              <li>Émettre et valider vos badges et tickets</li>
              <li>Traiter les paiements via notre prestataire GeniusPay</li>
              <li>Vous envoyer des confirmations et rappels par email</li>
              <li>Assurer le bon fonctionnement de la plateforme</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">3. Base légale</h2>
            <p>
              Le traitement de vos données repose sur l&apos;exécution du contrat (inscription à
              un événement) et votre consentement (envoi de communications). Vous pouvez
              retirer votre consentement à tout moment en nous contactant.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">4. Destinataires des données</h2>
            <p>Vos données sont accessibles à :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>L&apos;équipe AIKO Board (gestion de la plateforme)</li>
              <li>Les organisateurs des événements auxquels vous participez</li>
              <li>GeniusPay (traitement des paiements)</li>
              <li>Vercel (hébergement)</li>
              <li>Neon (base de données)</li>
              <li>Resend (envoi d&apos;emails transactionnels)</li>
              <li>Cloudinary (stockage d&apos;images)</li>
            </ul>
            <p className="mt-2">
              Aucune donnée n&apos;est vendue ou partagée à des fins publicitaires.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">5. Durée de conservation</h2>
            <p>
              Les données de participation sont conservées pendant 2 ans après le dernier
              événement auquel vous avez participé. Les données de paiement sont conservées
              conformément aux obligations légales (5 ans). Vous pouvez demander la
              suppression anticipée de vos données en nous contactant.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">6. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger
              vos données : chiffrement des communications (HTTPS/TLS), hachage des mots de
              passe (bcrypt), limitation du taux de requêtes, contrôle d&apos;accès basé sur les
              rôles.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">7. Vos droits</h2>
            <p>Conformément à la réglementation applicable, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Accès :</strong> obtenir une copie de vos données</li>
              <li><strong>Rectification :</strong> corriger des données inexactes</li>
              <li><strong>Suppression :</strong> demander l&apos;effacement de vos données</li>
              <li><strong>Portabilité :</strong> recevoir vos données dans un format structuré</li>
              <li><strong>Opposition :</strong> vous opposer au traitement de vos données</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits, contactez-nous à : <strong>contact@aikoboard.com</strong>
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">8. Cookies</h2>
            <p>
              AIKO Board utilise uniquement des cookies essentiels au fonctionnement du
              service : session d&apos;authentification et préférences de langue. Aucun cookie de
              tracking, publicitaire ou analytique n&apos;est déposé.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-[22px] text-ink mb-3">9. Contact</h2>
            <p>
              Pour toute question relative à la protection de vos données personnelles :<br />
              <strong>Email :</strong> contact@aikoboard.com<br />
              <strong>Adresse :</strong> Abidjan, Côte d&apos;Ivoire
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
