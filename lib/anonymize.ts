import { prisma } from "./prisma";
import { log } from "./logger";

/**
 * Anonymisation des données personnelles des participants.
 *
 * On ne supprime pas la ligne : le numéro de ticket, le montant et le
 * check-in restent nécessaires à la comptabilité et aux statistiques de
 * l'événement. Seules les données identifiantes sont effacées.
 */

/** Durée de conservation des données personnelles après la fin de l'événement. */
export const RETENTION_MONTHS = 12;

const ANON_DOMAIN = "anonymise.invalid";

export function isAnonymized(email: string): boolean {
  return email.endsWith(`@${ANON_DOMAIN}`);
}

/** Date avant laquelle un événement terminé doit être purgé. */
export function retentionCutoff(now: Date = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
  return cutoff;
}

function anonymizedFields(id: string) {
  return {
    prenom: "Participant",
    nom: "anonymise",
    email: `${id}@${ANON_DOMAIN}`,
    telephone: "",
    organisation: null,
    titre: null,
    photoUrl: null,
  };
}

/** Anonymise une inscription précise. Renvoie false si elle l'était déjà. */
export async function anonymizeParticipant(reference: string): Promise<boolean> {
  const participant = await prisma.participant.findUnique({
    where: { reference },
    select: { id: true, email: true },
  });

  if (!participant || isAnonymized(participant.email)) return false;

  await prisma.participant.update({
    where: { id: participant.id },
    data: anonymizedFields(participant.id),
  });

  log.info("Participant anonymise", { ref: reference });
  return true;
}

/**
 * Anonymise toutes les inscriptions dont l'événement est terminé depuis
 * plus longtemps que la durée de conservation.
 */
export async function anonymizeExpiredParticipants(now: Date = new Date()): Promise<number> {
  const cutoff = retentionCutoff(now);

  const expired = await prisma.participant.findMany({
    where: {
      email: { not: { endsWith: `@${ANON_DOMAIN}` } },
      event: { dateFin: { lt: cutoff } },
    },
    select: { id: true },
  });

  for (const participant of expired) {
    await prisma.participant.update({
      where: { id: participant.id },
      data: anonymizedFields(participant.id),
    });
  }

  if (expired.length > 0) {
    log.info("Purge RGPD effectuee", { action: "anonymize", count: expired.length });
  }

  return expired.length;
}
