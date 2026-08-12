import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { requireAnyAdmin } from "@/lib/admin-auth";
import { participantSchema } from "@/lib/validation";

function genRef() {
  return `AIKO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function formatDateRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  return `${start.toLocaleDateString("fr-FR", { day: "numeric" })} — ${end.toLocaleDateString("fr-FR", opts)}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const blocked = await rateLimit(req, "participants", 5, "60 s");
    if (blocked) return blocked;

    const { slug } = await params;
    const event = await prisma.event.findUnique({
      where: { slug },
      include: { _count: { select: { participants: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Evenement introuvable" }, { status: 404 });
    }

    const raw = await req.json();
    const parsed = participantSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const body = parsed.data;
    const ticketNumber = event._count.participants + 1;
    const isBadge = (body.type ?? (event.type === "concert" ? "ticket" : "badge")) === "badge";
    const isPaid = (isBadge && event.badgePayant) || (!isBadge && event.ticketPayant);
    const statut = isPaid ? "pending" : "confirme";

    const participant = await prisma.participant.create({
      data: {
        eventId: event.id,
        reference: genRef(),
        ticketNumber,
        prenom: body.prenom,
        nom: body.nom,
        email: body.email,
        telephone: body.telephone,
        organisation: body.organisation,
        type: body.type ?? (event.type === "concert" ? "ticket" : "badge"),
        statut,
        montant: body.montant ?? 0,
        paymentRef: body.paymentRef,
        residenceTarifId: body.residenceTarifId ?? null,
      },
    });

    if (statut === "confirme" && body.email) {
      sendConfirmationEmail({
        to: body.email,
        participantName: `${body.prenom} ${body.nom}`,
        eventName: event.nom,
        eventDate: formatDateRange(event.dateDebut, event.dateFin),
        eventLieu: `${event.lieu} · ${event.ville}`,
        reference: participant.reference,
        ticketNumber: participant.ticketNumber,
        type: participant.type as "badge" | "ticket",
        amount: body.montant ?? 0,
      }).catch(() => {});
    }

    sendAdminNotificationEmail({
      type: "new_registration",
      eventName: event.nom,
      participantName: `${body.prenom} ${body.nom}`,
      reference: participant.reference,
      amount: body.montant ?? 0,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: {
        reference: participant.reference,
        ticketNumber: participant.ticketNumber,
        type: participant.type,
      },
    });
  } catch (err) {
    console.error("[participants] create error:", err);
    return NextResponse.json({ error: "Erreur inscription" }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { error } = await requireAnyAdmin();
  if (error) return error;

  try {
    const { slug } = await params;
    const event = await prisma.event.findUnique({
      where: { slug },
    });

    if (!event) {
      return NextResponse.json({ error: "Evenement introuvable" }, { status: 404 });
    }

    const participants = await prisma.participant.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: participants });
  } catch (err) {
    console.error("[participants] list error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
