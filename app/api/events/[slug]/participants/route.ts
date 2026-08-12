import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { requireAnyAdmin } from "@/lib/admin-auth";
import { participantSchema } from "@/lib/validation";
import { uploadBase64Image } from "@/lib/cloudinary";

function genRef() {
  const bytes = require("crypto").randomBytes(4);
  return `AIKO-${bytes.toString("hex").toUpperCase()}`;
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
    const { photo, ...rest } = raw;
    const parsed = participantSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const body = parsed.data;
    const ticketNumber = event._count.participants + 1;
    const isBadge = (body.type ?? (event.type === "concert" ? "ticket" : "badge")) === "badge";
    const isPaid = (isBadge && event.badgePayant) || (!isBadge && event.ticketPayant);
    const statut = isPaid ? "pending" : "confirme";

    let photoUrl = body.photoUrl;
    if (!photoUrl && photo && typeof photo === "string" && photo.startsWith("data:image/")) {
      try {
        const uploaded = await uploadBase64Image(photo, "badges");
        photoUrl = uploaded.url;
      } catch {}
    }

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
        titre: body.titre,
        photoUrl,
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
  } catch {
    console.error("[participants] create error");
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
  } catch {
    console.error("[participants] list error");
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
