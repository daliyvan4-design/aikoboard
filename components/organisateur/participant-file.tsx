"use client";

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe2,
  MapPin,
  Plane,
  ReceiptText,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import { countryName } from "@/lib/countries";

/**
 * Dossier complet d'un participant, pour l'organisateur.
 *
 * Le tableau d'origine ne montrait que le nom, l'email et le montant : tout
 * ce qui sert vraiment a preparer un accueil — vol, visa, hebergement,
 * services demandes, devis — restait invisible. La ligne resume l'essentiel,
 * le depli donne la totalite du dossier, quel que soit le type de client.
 */

export interface ParticipantFile {
  id: string;
  reference: string;
  ticketNumber: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  organisation: string | null;
  titre: string | null;
  photoUrl?: string | null;
  type: string;
  statut: string;
  montant: number;
  checkedIn: boolean;
  checkedInAt?: string | null;
  createdAt: string;
  serviceIds?: string[];
  typeParticipant?: string;
  passeport?: string | null;
  paysDepart?: string | null;
  numeroVol?: string | null;
  planVol?: string | null;
  aVisa?: boolean | null;
  dateArrivee?: string | null;
  dateRetour?: string | null;
  residence?: { id: string; nom: string; quartier: string | null; ville: string } | null;
  residenceTarif?: {
    label: string;
    typeChambre: string;
    prixParNuit: number;
    capacite: number;
  } | null;
  commandes?: {
    reference: string;
    statut: string;
    montantTotal: number;
    notes: string | null;
    dateArrivee: string;
    dateDepart: string;
    nombrePersonnes: number;
    nationalite: string;
  }[];
}

/** Un participant rattache a une organisation est traite comme institutionnel. */
export function estInstitutionnel(p: ParticipantFile): boolean {
  return Boolean(p.organisation && p.organisation.trim().length > 0);
}

export function estInternational(p: ParticipantFile): boolean {
  return p.typeParticipant === "international";
}

const nombre = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

function dateHeure(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function jour(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Champ({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.16em] text-mute">{label}</p>
      <p className="text-[13px] text-ink mt-0.5 break-words">{valeur}</p>
    </div>
  );
}

function Bloc({
  titre,
  icone: Icone,
  children,
}: {
  titre: string;
  icone: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-cream2 border border-line rounded-xl p-4 min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-ink font-medium mb-3 flex items-center gap-2">
        <Icone className="w-3.5 h-3.5 text-gold shrink-0" />
        {titre}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  );
}

interface Props {
  participant: ParticipantFile;
  /** Nom d'un service a partir de son identifiant */
  serviceName: (id: string) => string;
}

export function ParticipantFileRow({ participant: p, serviceName }: Props) {
  const [ouvert, setOuvert] = useState(false);

  const services = p.serviceIds ?? [];
  const devis = p.commandes?.[0];
  const international = estInternational(p);

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        className="w-full text-left px-5 py-4 hover:bg-cream2/60 transition-colors flex items-start gap-3 min-w-0"
      >
        <span className="mono text-[12px] font-semibold text-ink pt-0.5 shrink-0">
          {String(p.ticketNumber).padStart(4, "0")}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] text-ink font-medium">
              {p.prenom} {p.nom}
            </span>
            {estInstitutionnel(p) && (
              <span className="text-[10px] uppercase tracking-wider bg-ink/5 text-ink rounded-full px-2 py-0.5">
                Institutionnel
              </span>
            )}
            {international && (
              <span className="text-[10px] uppercase tracking-wider bg-gold/15 text-gold rounded-full px-2 py-0.5">
                International
              </span>
            )}
          </span>

          <span className="block text-[12px] text-mute mt-0.5 truncate">
            {p.organisation ? `${p.organisation} · ` : ""}
            {p.email}
          </span>

          {(p.residence || services.length > 0) && (
            <span className="block text-[11px] text-gold mt-1 truncate">
              {[
                p.residence ? p.residence.nom : null,
                services.length > 0 ? services.map(serviceName).join(" · ") : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </span>

        <span className="text-right shrink-0 flex items-center gap-3">
          <span className="text-[12px] mono text-ink">
            {p.montant > 0 ? `${nombre(p.montant)} XOF` : "Gratuit"}
          </span>
          {p.checkedIn ? (
            <CheckCircle2 className="w-4 h-4 text-ok" />
          ) : (
            <XCircle className="w-4 h-4 text-line" />
          )}
          {ouvert ? (
            <ChevronUp className="w-4 h-4 text-mute" />
          ) : (
            <ChevronDown className="w-4 h-4 text-mute" />
          )}
        </span>
      </button>

      {ouvert && (
        <div className="px-5 pb-5 grid gap-3 sm:grid-cols-2 animate-fade-up min-w-0">
          <Bloc titre="Identité & contact" icone={User}>
            <Champ label="Référence" valeur={p.reference} />
            <Champ label="Badge n°" valeur={String(p.ticketNumber).padStart(4, "0")} />
            <Champ label="Email" valeur={p.email} />
            <Champ label="Téléphone" valeur={p.telephone} />
            <Champ label="Organisation" valeur={p.organisation || "—"} />
            <Champ label="Titre / fonction" valeur={p.titre || "—"} />
          </Bloc>

          <Bloc titre="Participation" icone={Building2}>
            <Champ label="Type" valeur={p.type === "ticket" ? "Ticket" : "Badge"} />
            <Champ
              label="Statut"
              valeur={p.statut === "confirme" ? "Confirmé" : p.statut === "pending" ? "En attente" : p.statut}
            />
            <Champ label="Montant" valeur={p.montant > 0 ? `${nombre(p.montant)} XOF` : "Gratuit"} />
            <Champ
              label="Check-in"
              valeur={p.checkedIn ? dateHeure(p.checkedInAt) : "Pas encore"}
            />
            <Champ label="Inscription" valeur={dateHeure(p.createdAt)} />
            <Champ
              label="Provenance"
              valeur={international ? "International" : "Local"}
            />
          </Bloc>

          {international && (
            <Bloc titre="Voyage" icone={Plane}>
              <Champ label="Passeport" valeur={p.passeport || "—"} />
              <Champ
                label="Pays de départ"
                valeur={p.paysDepart ? countryName(p.paysDepart) : "—"}
              />
              <Champ label="Numéro de vol" valeur={p.numeroVol || "—"} />
              <Champ
                label="Visa"
                valeur={p.aVisa === true ? "Oui" : p.aVisa === false ? "Non — à traiter" : "—"}
              />
              <Champ label="Arrivée" valeur={dateHeure(p.dateArrivee)} />
              <Champ label="Retour" valeur={dateHeure(p.dateRetour)} />
              {p.planVol && (
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-mute">Plan de vol</p>
                  <p className="text-[13px] text-ink mt-0.5 whitespace-pre-line break-words">
                    {p.planVol}
                  </p>
                </div>
              )}
            </Bloc>
          )}

          {p.residence && (
            <Bloc titre="Hébergement" icone={MapPin}>
              <Champ label="Résidence" valeur={p.residence.nom} />
              <Champ
                label="Quartier"
                valeur={[p.residence.quartier, p.residence.ville].filter(Boolean).join(", ")}
              />
              <Champ label="Chambre" valeur={p.residenceTarif?.label ?? "à définir"} />
              <Champ
                label="Prix / nuit"
                valeur={
                  p.residenceTarif
                    ? `${nombre(p.residenceTarif.prixParNuit)} XOF · ${p.residenceTarif.typeChambre}`
                    : "sur demande"
                }
              />
            </Bloc>
          )}

          {services.length > 0 && (
            <Bloc titre="Conciergerie" icone={Sparkles}>
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-mute">
                  Services demandés
                </p>
                <ul className="mt-1 space-y-0.5">
                  {services.map((id) => (
                    <li key={id} className="text-[13px] text-ink">
                      {serviceName(id)}
                    </li>
                  ))}
                </ul>
              </div>
            </Bloc>
          )}

          {devis && (
            <Bloc titre="Devis" icone={ReceiptText}>
              <Champ label="Référence" valeur={devis.reference} />
              <Champ
                label="Statut"
                valeur={
                  devis.statut === "EN_ATTENTE"
                    ? "À chiffrer"
                    : devis.statut === "CONFIRMEE"
                      ? "Confirmé"
                      : devis.statut
                }
              />
              <Champ
                label="Montant estimé"
                valeur={devis.montantTotal > 0 ? `${nombre(devis.montantTotal)} XOF` : "à chiffrer"}
              />
              <Champ label="Personnes" valeur={String(devis.nombrePersonnes)} />
              <Champ label="Séjour du" valeur={jour(devis.dateArrivee)} />
              <Champ label="au" valeur={jour(devis.dateDepart)} />
              {devis.nationalite && (
                <Champ label="Nationalité" valeur={countryName(devis.nationalite)} />
              )}
              {devis.notes && (
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-mute">Note</p>
                  <p className="text-[13px] text-ink mt-0.5 break-words">{devis.notes}</p>
                </div>
              )}
            </Bloc>
          )}

          {!international && !p.residence && services.length === 0 && !devis && (
            <div className="sm:col-span-2 text-[12px] text-mute flex items-center gap-2">
              <Globe2 className="w-3.5 h-3.5 text-mute shrink-0" />
              Participant local, sans demande de conciergerie ni hébergement.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
