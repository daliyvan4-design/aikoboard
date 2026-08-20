import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env", override: true });
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Deplace les vehicules avec chauffeur dans leur propre categorie.
 *
 * "Transport" melangeait deux choses : des vehicules, qui s'excluent —
 * on n'en prend qu'un — et des prestations qui les completent (accueil
 * VIP a l'aeroport, escorte de securite, transfert heliporte). Les
 * separer permet d'imposer le choix unique sans empecher un participant
 * de demander une berline *et* un accueil VIP.
 */
const VEHICULES = [
  "Berline avec chauffeur · 4h",
  "Berline luxe · 4h",
  "Van 7 places · 8h",
  "4x4 · journée",
  "4x4 luxe · journée",
];

async function main() {
  const { count } = await prisma.service.updateMany({
    where: { nom: { in: VEHICULES } },
    data: { categorie: "vehicule" },
  });
  console.log(`${count} service(s) reclasse(s) en "vehicule"\n`);

  for (const categorie of ["vehicule", "transport"]) {
    const list = await prisma.service.findMany({
      where: { categorie, actif: true },
      select: { nom: true, prixBase: true, unite: true },
      orderBy: { ordre: "asc" },
    });
    console.log(`${categorie.toUpperCase()} (${list.length})`);
    for (const s of list) {
      console.log(`  ${s.nom.padEnd(30)} ${new Intl.NumberFormat("fr-FR").format(s.prixBase).padStart(8)} XOF / ${s.unite}`);
    }
    console.log();
  }
}
main().catch((e) => console.error("ERREUR:", e.message)).finally(() => prisma.$disconnect());
