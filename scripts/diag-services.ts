import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env", override: true });
import { chromium, type Page } from "playwright";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.DIAG_BASE ?? "https://aikoboard.com";
const prisma = new PrismaClient();

/**
 * Parcourt reellement les deux formulaires, champs obligatoires remplis,
 * et compte les cases du selecteur de services rendues a l'ecran.
 */
async function pickerState(page: Page) {
  return page.evaluate(() => {
    const cases = [...document.querySelectorAll("label")].filter(
      (l) => l.querySelector('input[type="checkbox"]') && /XOF \/|Inclus/.test(l.textContent ?? ""),
    );
    return {
      titre: [...document.querySelectorAll("p, span, label")].some((el) =>
        /Conciergerie\s*&?\s*services suppl|Services de conciergerie/i.test(el.textContent ?? ""),
      ),
      services: cases.length,
      exemples: cases.slice(0, 3).map((l) => (l.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 48)),
      chargement: document.body.innerText.includes("Chargement des services"),
    };
  });
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });

  // ── 1. Formulaire de creation, champs obligatoires remplis
  await page.goto(`${BASE}/fr/evenements/creer`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const fill = async (placeholder: RegExp, value: string) => {
    const el = page.locator(`input[placeholder*="${placeholder.source}" i]`).first();
    if (await el.count()) await el.fill(value).catch(() => {});
  };

  // Etape 1 : nom + organisateur
  const textInputs = page.locator('input[type="text"], input:not([type])');
  const n = await textInputs.count();
  for (let i = 0; i < Math.min(n, 2); i++) {
    await textInputs.nth(i).fill(i === 0 ? "Diagnostic services" : "AIKO").catch(() => {});
  }
  await page.locator("button", { hasText: /^\s*Suivant/ }).first().click().catch(() => {});
  await page.waitForTimeout(700);

  // Etape 2 : date + lieu + ville
  const dates = page.locator('input[type="date"]');
  if (await dates.count()) await dates.first().fill("2027-06-01").catch(() => {});
  const step2Texts = page.locator('input[type="text"], input:not([type])');
  const m = await step2Texts.count();
  for (let i = 0; i < m; i++) {
    const ph = (await step2Texts.nth(i).getAttribute("placeholder")) ?? "";
    if (/lieu|sofitel|salle/i.test(ph)) await step2Texts.nth(i).fill("Sofitel").catch(() => {});
    if (/ville|abidjan/i.test(ph)) await step2Texts.nth(i).fill("Abidjan").catch(() => {});
  }
  await page.locator("button", { hasText: /^\s*Suivant/ }).first().click().catch(() => {});
  await page.waitForTimeout(1500);

  const creation = await pickerState(page);
  console.log("FORMULAIRE DE CREATION (etape 3)");
  console.log(`  titre du bloc : ${creation.titre ? "present" : "ABSENT"}`);
  console.log(`  cases de services : ${creation.services}${creation.chargement ? " (en chargement)" : ""}`);
  for (const e of creation.exemples) console.log(`    ${e}`);

  // ── 2. Formulaire d'inscription, sur un evenement qui propose des services
  const evt = await prisma.event.findFirst({
    where: { serviceIds: { isEmpty: false } },
    select: { slug: true, statut: true, serviceIds: true },
  });

  if (!evt) {
    console.log("\naucun evenement ne propose de services");
  } else {
    const reactivate = evt.statut !== "actif";
    if (reactivate) {
      await prisma.event.update({ where: { slug: evt.slug }, data: { statut: "actif" } });
    }

    await page.goto(`${BASE}/fr/evenements/${evt.slug}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const cta = page.locator("button", { hasText: /inscrire|obtenir|participer/i }).first();
    if (await cta.count()) {
      await cta.click().catch(() => {});
      await page.waitForTimeout(1200);
    }

    const inscription = await pickerState(page);
    console.log(`\nFORMULAIRE D'INSCRIPTION — ${evt.slug} (pack de ${evt.serviceIds.length})`);
    console.log(`  titre du bloc : ${inscription.titre ? "present" : "ABSENT"}`);
    console.log(`  cases de services : ${inscription.services}`);
    for (const e of inscription.exemples) console.log(`    ${e}`);

    if (reactivate) {
      await prisma.event.update({ where: { slug: evt.slug }, data: { statut: evt.statut } });
    }
  }

  await browser.close();
}

main()
  .catch((e) => console.error("ERREUR:", e.message))
  .finally(() => prisma.$disconnect());
