import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { log } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

  return NextResponse.json({
    success: true,
    events: events.length,
    reminders: sent,
  });
}
