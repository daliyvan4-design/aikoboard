import { randomBytes } from "crypto";
import { prisma } from "./prisma";
import { log } from "./logger";
import { sendAdminNotificationEmail } from "./email";
import { countryName } from "./countries";

/**
 * Devis de conciergerie ne d'une inscription a un evenement.
 *
 * Le badge se paie tout de suite ; les services coches deviennent une
 * commande EN_ATTENTE que l'equipe chiffre et facture ensuite. On ne
 * prend pas l'argent a l'aveugle : sept services du catalogue se facturent
 * a la nuit, a la journee, a la course ou a la mission, et personne ne
 * peut les chiffrer sans connaitre le sejour reel.
 *
 * Les quantites proposees ici sont une premiere estimation, ajustable
 * dans le back-office.
 */

export interface QuoteInput {
  participantId: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  serviceIds: string[];
  /** Dates du sejour ; a defaut, celles de l'evenement. */
  dateArrivee: Date;
  dateDepart: Date;
  nombrePersonnes: number;
  /** Code pays ISO, vide si le participant ne l'a pas renseigne. */
  nationalite?: string;
  langue?: string;
  /** Nom de l'evenement, pour la notification interne. */
  eventName?: string;
}

function generateReference(): string {
  return `AIKO-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/** Nombre de nuits entre deux dates, au minimum une. */
export function countNights(arrivee: Date, depart: Date): number {
  const ms = depart.getTime() - arrivee.getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

/**
 * Quantite proposee selon l'unite de facturation du service.
 * Tout ce qui n'est ni une nuit ni un tarif par personne compte pour une
 * prestation : une course, une mission, une seance se commandent a l'unite.
 */
export function suggestQuantity(unite: string, nights: number, people: number): number {
  switch (unite) {
    case "nuit":
      return nights;
    case "pax":
      // Un repas par personne et par jour de presence
      return people * (nights + 1);
    case "personne":
    case "vol":
      return people;
    default:
      return 1;
  }
}

/**
 * Cree le devis. Ne leve jamais : une inscription reussie ne doit pas
 * echouer parce que la demande de conciergerie n'a pas pu etre enregistree.
 */
export async function createQuoteFromRegistration(
  input: QuoteInput,
): Promise<{ reference: string; montantTotal: number } | null> {
  if (input.serviceIds.length === 0) return null;

  try {
    const services = await prisma.service.findMany({
      where: { id: { in: input.serviceIds }, actif: true },
      include: { tarifs: { where: { actif: true } } },
    });
    if (services.length === 0) return null;

    const nights = countNights(input.dateArrivee, input.dateDepart);
    const people = Math.max(1, input.nombrePersonnes);

    let montantTotal = 0;
    const lignes = services.map((service) => {
      const tarif = service.tarifs[0];
      const prixUnitaire = tarif ? tarif.prix : service.prixBase;
      const quantite = suggestQuantity(service.unite, nights, people);
      const sousTotal = prixUnitaire * quantite;
      montantTotal += sousTotal;
      return {
        serviceId: service.id,
        tarifId: tarif?.id ?? null,
        quantite,
        prixUnitaire,
        sousTotal,
      };
    });

    const commande = await prisma.commande.create({
      data: {
        reference: generateReference(),
        participantId: input.participantId,
        typeReservation: "NORMALE",
        statut: "EN_ATTENTE",
        langue: input.langue ?? "fr",
        prenom: input.prenom,
        nom: input.nom,
        email: input.email,
        telephone: input.telephone,
        nationalite: input.nationalite ?? "",
        dateArrivee: input.dateArrivee,
        dateDepart: input.dateDepart,
        nombrePersonnes: people,
        montantTotal,
        lignes: { create: lignes },
      },
      select: { reference: true, montantTotal: true },
    });

    log.info("Devis de conciergerie cree", {
      action: "quote",
      ref: commande.reference,
      services: lignes.length,
    });

    // L'equipe doit savoir qu'un devis attend, sans surveiller le back-office
    const sejour = `${input.dateArrivee.toLocaleDateString("fr-FR")} au ${input.dateDepart.toLocaleDateString("fr-FR")} · ${people} pers.${
      input.nationalite ? ` · ${countryName(input.nationalite)}` : ""
    }`;
    sendAdminNotificationEmail({
      type: "quote_requested",
      eventName: input.eventName ?? "Evenement",
      participantName: `${input.prenom} ${input.nom}`,
      reference: commande.reference,
      amount: montantTotal,
      sejour,
      services: services.map((s, i) => `${s.nom} — ${lignes[i].quantite} x ${new Intl.NumberFormat("fr-FR").format(lignes[i].prixUnitaire)} XOF`),
    }).catch(() => {});

    return commande;
  } catch (err) {
    log.error("Creation du devis de conciergerie impossible", { action: "quote" }, err);
    return null;
  }
}
