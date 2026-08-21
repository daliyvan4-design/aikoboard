import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const { error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  const { commandeId } = await request.json();

  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: {
      lignes: {
        include: { service: true, residenceTarif: { include: { residence: true } } },
      },
    },
  });
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  await prisma.planningEntry.deleteMany({ where: { commandeId, auto: true } });

  const arrivalDate = new Date(commande.dateArrivee);
  const departureDate = new Date(commande.dateDepart);
  const totalDays = Math.ceil((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));

  const entries: Array<{
    commandeId: string;
    jour: number;
    heure: string;
    type: string;
    titre: string;
    details: string | null;
    serviceId: string | null;
    auto: boolean;
  }> = [];

  for (const ligne of commande.lignes) {
    // Nuitees dans une residence du parc : la ligne ne porte pas de
    // service du catalogue, mais une chambre reelle.
    if (ligne.residenceTarif) {
      const residence = ligne.residenceTarif.residence;
      for (let d = 1; d <= totalDays; d++) {
        entries.push({
          commandeId,
          jour: d,
          heure: d === 1 ? "14:00" : "00:00",
          type: "hebergement",
          titre: residence.nom,
          details: `${ligne.residenceTarif.label} · ${ligne.quantite} nuit(s)`,
          serviceId: null,
          auto: true,
        });
      }
      continue;
    }

    const service = ligne.service;
    // Ligne sans objet planifiable (service retire du catalogue)
    if (!service) continue;
    const cat = service.categorie;

    if (cat === "transport") {
      entries.push({
        commandeId,
        jour: 1,
        heure: commande.heureArrivee || "08:00",
        type: "transport",
        titre: `${service.nom}`,
        details: null,
        serviceId: ligne.serviceId,
        auto: true,
      });
    } else if (cat === "hebergement") {
      for (let d = 1; d <= totalDays; d++) {
        entries.push({
          commandeId,
          jour: d,
          heure: d === 1 ? "14:00" : "00:00",
          type: "hebergement",
          titre: `${service.nom}`,
          details: `${ligne.quantite} nuit(s)`,
          serviceId: ligne.serviceId,
          auto: true,
        });
      }
    } else if (cat === "repas") {
      for (let d = 1; d <= totalDays; d++) {
        const heure = service.nom.toLowerCase().includes("petit") ? "07:30"
          : service.nom.toLowerCase().includes("déjeuner") || service.nom.toLowerCase().includes("lunch") ? "12:30"
          : "19:30";
        entries.push({
          commandeId,
          jour: d,
          heure,
          type: "repas",
          titre: `${service.nom}`,
          details: `${commande.nombrePersonnes} pax`,
          serviceId: ligne.serviceId,
          auto: true,
        });
      }
    } else {
      entries.push({
        commandeId,
        jour: 1,
        heure: "10:00",
        type: "extra",
        titre: `${service.nom}`,
        details: `Qté: ${ligne.quantite}`,
        serviceId: ligne.serviceId,
        auto: true,
      });
    }
  }

  if (entries.length > 0) {
    await prisma.planningEntry.createMany({ data: entries });
  }

  const created = await prisma.planningEntry.findMany({
    where: { commandeId, auto: true },
    orderBy: [{ jour: "asc" }, { heure: "asc" }],
  });

  return NextResponse.json(created, { status: 201 });
}
