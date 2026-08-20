import { isKnownCountry } from "./countries";

/**
 * Informations de voyage d'un participant international.
 *
 * Un participant local s'inscrit sans rien de plus : on ne lui demande ni
 * passeport ni plan de vol. Ces champs n'existent que pour l'international,
 * ou ils donnent a l'organisateur la visibilite dont il a besoin pour
 * l'accueil aeroport, le protocole et les transferts.
 */

export const PARTICIPANT_TYPES = ["local", "international"] as const;
export type ParticipantType = (typeof PARTICIPANT_TYPES)[number];

export interface TravelInfo {
  typeParticipant: ParticipantType;
  passeport: string | null;
  paysDepart: string | null;
  numeroVol: string | null;
  planVol: string | null;
  aVisa: boolean | null;
  dateArrivee: Date | null;
  dateRetour: Date | null;
}

const LOCAL: TravelInfo = {
  typeParticipant: "local",
  passeport: null,
  paysDepart: null,
  numeroVol: null,
  planVol: null,
  aVisa: null,
  dateArrivee: null,
  dateRetour: null,
};

function texte(valeur: unknown, max: number): string | null {
  if (typeof valeur !== "string") return null;
  const propre = valeur.trim().slice(0, max);
  return propre.length > 0 ? propre : null;
}

function horodatage(valeur: unknown): Date | null {
  if (typeof valeur !== "string" || valeur.trim() === "") return null;
  const date = new Date(valeur);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Extrait les informations de voyage d'une requete d'inscription.
 * Un participant local repart avec tous les champs vides, meme si la
 * requete en contenait : ils n'auraient aucun sens.
 */
export function parseTravelInfo(raw: Record<string, unknown>): TravelInfo {
  if (raw.typeParticipant !== "international") return LOCAL;

  return {
    typeParticipant: "international",
    passeport: texte(raw.passeport, 40),
    paysDepart: isKnownCountry(raw.paysDepart) ? raw.paysDepart : null,
    numeroVol: texte(raw.numeroVol, 20),
    planVol: texte(raw.planVol, 500),
    aVisa: typeof raw.aVisa === "boolean" ? raw.aVisa : null,
    dateArrivee: horodatage(raw.dateArrivee),
    dateRetour: horodatage(raw.dateRetour),
  };
}
