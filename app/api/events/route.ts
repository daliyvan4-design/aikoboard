import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/logger";
import { EVENT_CREATION_PRICE_XOF } from "@/lib/pricing";
import { slugify, uniqueSlug } from "@/lib/slug";
import { sanitizeServiceIds } from "@/lib/event-services";
import { sanitizeResidenceIds } from "@/lib/event-residences";

/** Clé privée d'accès au tableau de bord organisateur. */
function generateManageToken(): string {
  return randomBytes(32).toString("hex");
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

    // Pack de conciergerie : seuls les services actifs du catalogue sont retenus
    const serviceIds = await sanitizeServiceIds(body.serviceIds);
    // Hebergements proposes : de vraies residences du parc, jamais une saisie libre
    const residenceIds = await sanitizeResidenceIds(body.residenceIds);

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
        serviceIds,
        residenceIds,
        institutionnel: body.institutionnel === true,
        residenceId: typeof body.residenceId === "string" ? body.residenceId : null,
        contactEmail: body.contactEmail.trim().substring(0, 200),
        contactTel: typeof body.contactTel === "string" ? body.contactTel.trim().substring(0, 30) : null,
        logoUrl: typeof body.logoUrl === "string" ? body.logoUrl : null,
        coverUrl: typeof body.coverUrl === "string" ? body.coverUrl : null,
        latitude: typeof body.latitude === "number" ? body.latitude : null,
        longitude: typeof body.longitude === "number" ? body.longitude : null,
        // L'événement n'est publié qu'une fois la création payée :
        // c'est le webhook GeniusPay (ou la réconciliation serveur) qui
        // le passe en "actif". Le client ne décide ni du statut ni du paiement.
        statut: "pending",
        paymentRef: null,
        manageToken: generateManageToken(),
      },
    });

    return NextResponse.json({
      success: true,
      slug: event.slug,
      id: event.id,
      statut: event.statut,
      manageToken: event.manageToken,
      creationFee: EVENT_CREATION_PRICE_XOF,
    });
  } catch (err) {
    log.error("Creation evenement impossible", { route: "POST /api/events" }, err);
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
    log.error("Liste evenements impossible", { route: "GET /api/events" }, err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
