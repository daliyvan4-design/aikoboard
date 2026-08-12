import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { anonymizeExpiredParticipants } from "@/lib/anonymize";
import { log } from "@/lib/logger";

/**
 * Comparaison a temps constant : sans elle, le secret peut se deviner
 * octet par octet en mesurant le temps de reponse.
 */
function isAuthorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  // Sans secret configure, la route reste fermee : sinon "Bearer undefined"
  // deviendrait un mot de passe valide.
  if (!secret) return false;
  if (!header) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(header);
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const events = await prisma.event.findMany({
    where: {
      statut: "actif",
      dateDebut: {
        gte: tomorrow,
        lt: dayAfter,
      },
    },
    include: {
      participants: {
        where: { statut: "confirme" },
        select: {
          email: true,
          prenom: true,
          nom: true,
          reference: true,
        },
      },
    },
  });

  let sent = 0;

  for (const event of events) {
    const fmtDate = (d: Date) =>
      d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const dateStr = `${event.dateDebut.toLocaleDateString("fr-FR", { day: "numeric" })} — ${fmtDate(event.dateFin)}`;
    const lieuStr = `${event.lieu} · ${event.ville}`;

    for (const p of event.participants) {
      await sendReminderEmail({
        to: p.email,
        participantName: `${p.prenom} ${p.nom}`,
        eventName: event.nom,
        eventDate: dateStr,
        eventLieu: lieuStr,
        reference: p.reference,
      });
      sent++;
    }
  }

  log.info(`${sent} rappels envoyes pour ${events.length} evenements`, { route: "GET /api/cron/reminders" });

  // Purge RGPD : les donnees personnelles ne survivent pas a la duree de
  // conservation, meme si personne ne les demande.
  const anonymized = await anonymizeExpiredParticipants();

  return NextResponse.json({
    success: true,
    events: events.length,
    reminders: sent,
    anonymized,
  });
}
