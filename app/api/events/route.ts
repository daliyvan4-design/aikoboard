import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  const existing = await prisma.event.findUnique({ where: { slug: base } });
  if (!existing) return base;
  for (let i = 2; i <= 50; i++) {
    const candidate = `${base}-${i}`;
    const found = await prisma.event.findUnique({ where: { slug: candidate } });
    if (!found) return candidate;
  }
  const bytes = require("crypto").randomBytes(3);
  return `${base}-${bytes.toString("hex")}`;
}

const ALLOWED_TYPES = ["conference", "concert", "seminaire", "gala", "forum", "salon", "festival", "autre"];

export async function POST(req: NextRequest) {
  try {
    const blocked = await rateLimit(req, "events-create", 3, "60 s");
    if (blocked) return blocked;

    const body = await req.json();

    if (!body.nom || typeof body.nom !== "string" || body.nom.length > 200) {
      return NextResponse.json({ error: "Nom invalide (max 200 caracteres)" }, { status: 400 });
    }
    if (!body.organisateur || typeof body.organisateur !== "string" || body.organisateur.length > 200) {
      return NextResponse.json({ error: "Organisateur invalide" }, { status: 400 });
    }
    if (!body.lieu || typeof body.lieu !== "string") {
      return NextResponse.json({ error: "Lieu requis" }, { status: 400 });
    }
    if (!body.ville || typeof body.ville !== "string") {
      return NextResponse.json({ error: "Ville requise" }, { status: 400 });
    }
    if (!body.dateDebut || !body.dateFin) {
      return NextResponse.json({ error: "Dates requises" }, { status: 400 });
    }
    if (!body.contactEmail || typeof body.contactEmail !== "string") {
      return NextResponse.json({ error: "Email de contact requis" }, { status: 400 });
    }

    const dateDebut = new Date(body.dateDebut);
    const dateFin = new Date(body.dateFin);
    if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
      return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
    }

    const type = ALLOWED_TYPES.includes(body.type) ? body.type : "conference";
    const capacite = Math.max(1, Math.min(100000, parseInt(body.capacite) || 500));
    const prixBadge = Math.max(0, parseFloat(body.prixBadge) || 0);
    const prixTicket = Math.max(0, parseFloat(body.prixTicket) || 0);

    const base = slugify(body.nom);
    const slug = await uniqueSlug(base);

    const event = await prisma.event.create({
      data: {
        slug,
        nom: body.nom.trim().substring(0, 200),
        type,
        description: typeof body.description === "string" ? body.description.substring(0, 2000) : null,
        organisateur: body.organisateur.trim().substring(0, 200),
        lieu: body.lieu.trim().substring(0, 200),
        ville: body.ville.trim().substring(0, 100),
        dateDebut,
        dateFin,
        capacite,
        badgePayant: body.badgePayant === true,
        prixBadge,
        ticketPayant: body.ticketPayant === true,
        prixTicket,
        offreLogement: body.offreLogement === true,
        offreVehicule: body.offreVehicule === true,
        offreExtras: body.offreExtras === true,
        institutionnel: body.institutionnel === true,
        residenceId: typeof body.residenceId === "string" ? body.residenceId : null,
        contactEmail: body.contactEmail.trim().substring(0, 200),
        contactTel: typeof body.contactTel === "string" ? body.contactTel.trim().substring(0, 30) : null,
        logoUrl: typeof body.logoUrl === "string" ? body.logoUrl : null,
        coverUrl: typeof body.coverUrl === "string" ? body.coverUrl : null,
        latitude: typeof body.latitude === "number" ? body.latitude : null,
        longitude: typeof body.longitude === "number" ? body.longitude : null,
        statut: "actif",
        paymentRef: typeof body.paymentRef === "string" ? body.paymentRef : null,
      },
    });

    return NextResponse.json({ success: true, slug: event.slug, id: event.id });
  } catch (err) {
    console.error("[events] create error:", err);
    return NextResponse.json({ error: "Erreur creation" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { statut: "actif" },
      orderBy: { dateDebut: "asc" },
      include: { _count: { select: { participants: true } } },
    });

    return NextResponse.json({ success: true, data: events });
  } catch (err) {
    console.error("[events] list error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
