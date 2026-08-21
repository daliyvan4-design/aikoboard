import { prisma } from "../lib/prisma";

/**
 * Bascule des hebergements vers le parc reel.
 *
 * Le catalogue de conciergerie contenait quatre "services" de categorie
 * hebergement issus du seed de demonstration (Pullman, Sofitel, Movenpick,
 * Noom). Ils n'ont ni photo, ni chambre, ni existence dans /admin/residences.
 * Les vraies adresses vivent dans Residence — ce sont elles que les
 * participants doivent voir.
 *
 * Le script masque les services fictifs, les retire des packs d'evenements
 * et propose le parc reel sur les evenements ouverts.
 *
 *   npx tsx scripts/hebergements-reels.ts          # simulation
 *   npx tsx scripts/hebergements-reels.ts --appliquer
 */

const APPLIQUER = process.argv.includes("--appliquer");

async function main() {
  const fictifs = await prisma.service.findMany({
    where: { categorie: "hebergement", actif: true },
    select: { id: true, nom: true, prixBase: true },
  });

  const residences = await prisma.residence.findMany({
    where: { statut: "actif" },
    select: { id: true, nom: true, _count: { select: { tarifs: true } } },
    orderBy: { nom: "asc" },
  });

  const events = await prisma.event.findMany({
    select: { id: true, nom: true, slug: true, statut: true, serviceIds: true, residenceIds: true },
  });

  console.log(`Services hebergement fictifs : ${fictifs.length}`);
  fictifs.forEach((s) => console.log(`  - ${s.nom} (${s.prixBase} XOF)`));

  console.log(`\nResidences reelles : ${residences.length}`);
  const sansTarif = residences.filter((r) => r._count.tarifs === 0);
  if (sansTarif.length > 0) {
    console.log(`  ${sansTarif.length} sans tarif -> "prix sur demande" cote participant`);
  }

  console.log("\nEvenements :");
  for (const e of events) {
    const aRetirer = e.serviceIds.filter((id) => fictifs.some((f) => f.id === id));
    console.log(
      `  ${e.slug} (${e.statut}) — ${aRetirer.length} service(s) fictif(s) a retirer, ` +
        `${e.residenceIds.length} residence(s) proposee(s)`,
    );
  }

  if (!APPLIQUER) {
    console.log("\nSimulation seule. Relancer avec --appliquer pour ecrire.");
    return;
  }

  // 1. Les services fictifs sortent du catalogue public
  if (fictifs.length > 0) {
    await prisma.service.updateMany({
      where: { id: { in: fictifs.map((f) => f.id) } },
      data: { actif: false },
    });
    console.log(`\n${fictifs.length} service(s) hebergement masque(s)`);
  }

  // 2. Ils quittent les packs deja composes
  const fictifIds = new Set(fictifs.map((f) => f.id));
  for (const e of events) {
    const propre = e.serviceIds.filter((id) => !fictifIds.has(id));
    if (propre.length === e.serviceIds.length) continue;
    await prisma.event.update({ where: { id: e.id }, data: { serviceIds: propre } });
    console.log(`  pack nettoye : ${e.slug}`);
  }

  // 3. Les evenements ouverts proposent le parc reel
  const tousLesIds = residences.map((r) => r.id);
  for (const e of events) {
    if (e.statut !== "actif" || e.residenceIds.length > 0) continue;
    await prisma.event.update({ where: { id: e.id }, data: { residenceIds: tousLesIds } });
    console.log(`  ${tousLesIds.length} residences proposees sur ${e.slug}`);
  }
}

main()
  .catch((e) => {
    console.error("ECHEC:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
