import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commandeSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

function generateReference(): string {
  const bytes = require("crypto").randomBytes(4);
  return `AIKO-${bytes.toString("hex").toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request, "commandes", 5, "60 s");
  if (blocked) return blocked;

  const body = await request.json();

  const parsed = commandeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { voyageur, lignes, devise, langue, typeReservation } = parsed.data;

  const arrivee = new Date(voyageur.dateArrivee);
  const depart = new Date(voyageur.dateDepart);
  if (depart <= arrivee) {
    return NextResponse.json(
      { error: "La date de départ doit être après la date d'arrivée" },
      { status: 400 }
    );
  }

  const serviceIds = lignes.map((l) => l.serviceId);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    include: { tarifs: true },
  });

  const serviceMap = new Map(services.map((s) => [s.id, s]));

  let montantTotal = 0;
  const lignesData = lignes.map((l) => {
    const service = serviceMap.get(l.serviceId);
    if (!service) throw new Error(`Service ${l.serviceId} not found`);
    const tarif = l.tarifId
      ? service.tarifs.find((t) => t.id === l.tarifId)
      : service.tarifs[0];
    const prixUnitaire = tarif ? tarif.prix : service.prixBase;
    const sousTotal = prixUnitaire * l.quantite;
    montantTotal += sousTotal;
    return {
      serviceId: l.serviceId,
      tarifId: tarif?.id || null,
      quantite: l.quantite,
      prixUnitaire,
      sousTotal,
    };
  });

  const commande = await prisma.commande.create({
    data: {
      reference: generateReference(),
      typeReservation: typeReservation || "NORMALE",
      langue,
      prenom: voyageur.prenom,
      nom: voyageur.nom,
      email: voyageur.email,
      telephone: voyageur.telephone,
      nationalite: voyageur.nationalite,
      dateArrivee: arrivee,
      dateDepart: depart,
      nombrePersonnes: voyageur.nombrePersonnes,
      compagnie: voyageur.compagnie,
      numeroVol: voyageur.numeroVol,
      heureArrivee: voyageur.heureArrivee,
      aeroport: voyageur.aeroport,
      passeport: voyageur.passeport,
      typeVisa: voyageur.typeVisa,
      statutVisa: voyageur.statutVisa,
      notes: voyageur.notes,
      montantTotal,
      devise,
      lignes: { create: lignesData },
    },
    include: { lignes: true },
  });

  return NextResponse.json(
    { reference: commande.reference, id: commande.id },
    { status: 201 }
  );
}
