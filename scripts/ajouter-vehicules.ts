import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env", override: true });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Complete le catalogue transport avec une gamme de vehicules.
 *
 * La berline existante couvrait seule tout le besoin ; il manquait le haut
 * de gamme et le tout-terrain, indispensables pour les delegations et les
 * deplacements hors Abidjan.
 */
const VEHICULES = [
  {
    nom: "Berline luxe · 4h",
    nomEn: "Luxury sedan · 4h",
    nomAr: "سيارة سيدان فاخرة · 4 ساعات",
    description: "Mercedes Classe S ou BMW Série 7, chauffeur bilingue FR/EN",
    descEn: "Mercedes S-Class or BMW 7 Series, bilingual driver",
    descAr: "مرسيدس الفئة S أو BMW الفئة السابعة، سائق ثنائي اللغة",
    prixBase: 95_000,
    unite: "course",
    ordre: 21,
  },
  {
    nom: "4x4 · journée",
    nomEn: "SUV · full day",
    nomAr: "سيارة دفع رباعي · يوم كامل",
    description: "Toyota Prado, chauffeur, idéal trajets hors Abidjan",
    descEn: "Toyota Prado with driver, ideal for trips outside Abidjan",
    descAr: "تويوتا برادو مع سائق، مثالية للرحلات خارج أبيدجان",
    prixBase: 98_000,
    unite: "journée",
    ordre: 22,
  },
  {
    nom: "4x4 luxe · journée",
    nomEn: "Luxury SUV · full day",
    nomAr: "دفع رباعي فاخر · يوم كامل",
    description: "Land Cruiser V8 ou Range Rover, chauffeur, vitres teintées",
    descEn: "Land Cruiser V8 or Range Rover, driver, tinted windows",
    descAr: "لاند كروزر V8 أو رينج روفر، سائق، نوافذ معتمة",
    prixBase: 145_000,
    unite: "journée",
    ordre: 23,
  },
];

async function main() {
  for (const v of VEHICULES) {
    const existe = await prisma.service.findFirst({ where: { nom: v.nom } });
    if (existe) {
      console.log(`  deja present : ${v.nom}`);
      continue;
    }
    await prisma.service.create({
      data: { ...v, categorie: "transport", actif: true },
    });
    console.log(`  ajoute : ${v.nom} — ${new Intl.NumberFormat("fr-FR").format(v.prixBase)} XOF / ${v.unite}`);
  }

  const transport = await prisma.service.findMany({
    where: { categorie: "transport", actif: true },
    select: { nom: true, prixBase: true, unite: true },
    orderBy: { ordre: "asc" },
  });
  console.log(`\ncatalogue transport : ${transport.length} prestations`);
  for (const s of transport) {
    console.log(`  ${s.nom.padEnd(28)} ${new Intl.NumberFormat("fr-FR").format(s.prixBase).padStart(8)} XOF / ${s.unite}`);
  }
}

main().catch((e) => console.error("ERREUR:", e.message)).finally(() => prisma.$disconnect());
