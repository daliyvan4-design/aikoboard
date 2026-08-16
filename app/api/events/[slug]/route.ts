import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEventSlug } from "@/lib/slug";
import { loadServices } from "@/lib/event-services";
import { log } from "@/lib/logger";

/**
 * Fiche publique d'un événement.
 *
 * Ne renvoie ni les coordonnées de l'organisateur, ni le token de gestion,
 * ni la liste des inscrits : ces données passent par
 * /api/events/[slug]/participants, protégé par session admin ou token.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug: requested } = await params;

    // Un ancien slug reste valide : on retrouve l'evenement et on annonce
    // l'adresse canonique dans la reponse.
    const resolved = await resolveEventSlug(requested);
    if (!resolved) {
      return NextResponse.json({ error: "Evenement introuvable" }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: resolved.id },
      select: {
        id: true,
        slug: true,
        nom: true,
        type: true,
        description: true,
        organisateur: true,
        lieu: true,
        ville: true,
        latitude: true,
        longitude: true,
        dateDebut: true,
        dateFin: true,
        capacite: true,
        logoUrl: true,
        coverUrl: true,
        badgePayant: true,
        prixBadge: true,
        ticketPayant: true,
        prixTicket: true,
        offreLogement: true,
        offreVehicule: true,
        offreExtras: true,
        institutionnel: true,
        serviceIds: true,
        statut: true,
        createdAt: true,
        _count: { select: { participants: true } },
        residence: {
          include: {
            images: { orderBy: { ordre: "asc" }, take: 5 },
            tarifs: { where: { actif: true }, orderBy: { prixParNuit: "asc" } },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Evenement introuvable" }, { status: 404 });
    }

    const checkedInCount = await prisma.participant.count({
      where: { eventId: event.id, checkedIn: true },
    });

    // Detail des services du pack, pour que le participant sache ce qu il
    // peut demander et a quel tarif indicatif.
    const services = await loadServices(event.serviceIds);

    return NextResponse.json({
      success: true,
      data: { ...event, checkedInCount, canonicalSlug: event.slug, services },
    });
  } catch (err) {
    log.error("Lecture evenement impossible", { route: "GET /api/events/[slug]" }, err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
