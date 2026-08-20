import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env", override: true });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = process.env.PACK_SLUG ?? "aiko-event-manager";

/**
 * Compose le pack de conciergerie de l'evenement de test.
 *
 * Tous les hebergements y figurent : le lieu de l'evenement ne dit rien de
 * l'endroit ou dorment les participants, et c'est a eux de choisir leur
 * hotel. Pour les autres categories, un service par unite de facturation —
 * chaque unite donnant une regle de quantite differente dans le devis
 * (nuits, personnes, prestation unique...).
 */
async function main() {
  const services = await prisma.service.findMany({
    where: { actif: true },
    select: { id: true, nom: true, categorie: true, unite: true, prixBase: true },
    orderBy: [{ categorie: "asc" }, { ordre: "asc" }],
  });

  // Tous les hotels : le participant choisit ou il dort
  const pack = services.filter((s) => s.categorie === "hebergement");

  // Puis un representant de chaque autre unite de facturation
  for (const unite of ["personne", "course", "pax", "pièce", "séance"]) {
    const found = services.find(
      (s) => s.unite === unite && s.categorie !== "hebergement" && !pack.some((p) => p.id === s.id),
    );
    if (found) pack.push(found);
  }

  const event = await prisma.event.update({
    where: { slug: SLUG },
    data: { serviceIds: pack.map((s) => s.id) },
    select: { nom: true, serviceIds: true },
  });

  console.log(`${event.nom} — pack de ${event.serviceIds.length} services :\n`);
  for (const s of pack) {
    console.log(
      `  ${s.categorie.padEnd(12)} ${s.nom.padEnd(30)} ${new Intl.NumberFormat("fr-FR").format(s.prixBase).padStart(8)} XOF / ${s.unite}`,
    );
  }
}

main()
  .catch((e) => console.error("ERREUR:", e.message))
  .finally(() => prisma.$disconnect());
