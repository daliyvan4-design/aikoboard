import { prisma } from "./prisma";
import { sendOrganizerAccessEmail } from "./email";
import { log } from "./logger";

/**
 * Envoi du lien privé de gestion à l'organisateur.
 *
 * Un événement devient actif de deux façons : par le paiement de sa
 * création, ou par une activation manuelle depuis le back-office. Les deux
 * chemins passent par ici — sinon un organisateur active par l'équipe AIKO
 * n'aurait aucun moyen d'accéder à ses inscrits.
 */

export function publicBaseUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "https://aikoboard.com").replace(/\/$/, "");
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export interface OrganizerEvent {
  slug: string;
  nom: string;
  organisateur: string;
  contactEmail: string;
  dateDebut: Date;
  dateFin: Date;
  manageToken: string | null;
}

export function organizerManageUrl(event: Pick<OrganizerEvent, "slug" | "manageToken">): string {
  return `${publicBaseUrl()}/fr/organisateur/${event.slug}?token=${event.manageToken ?? ""}`;
}

/** N'échoue jamais : un email non parti ne doit pas casser l'activation. */
export async function sendOrganizerAccess(event: OrganizerEvent): Promise<void> {
  try {
    await sendOrganizerAccessEmail({
      to: event.contactEmail,
      organisateur: event.organisateur,
      eventName: event.nom,
      eventDate: `${fmtDate(event.dateDebut)} - ${fmtDate(event.dateFin)}`,
      manageUrl: organizerManageUrl(event),
      publicUrl: `${publicBaseUrl()}/fr/evenements/${event.slug}`,
    });
    log.info("Lien organisateur envoye", { slug: event.slug });
  } catch (err) {
    log.warn("Envoi du lien organisateur impossible", { slug: event.slug }, err);
  }
}

/** Charge l'événement puis lui envoie son lien de gestion. */
export async function sendOrganizerAccessBySlug(slug: string): Promise<boolean> {
  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      slug: true,
      nom: true,
      organisateur: true,
      contactEmail: true,
      dateDebut: true,
      dateFin: true,
      manageToken: true,
    },
  });

  if (!event) return false;
  await sendOrganizerAccess(event);
  return true;
}
