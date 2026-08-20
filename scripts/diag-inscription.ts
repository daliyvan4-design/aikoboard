import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env", override: true });
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.DIAG_BASE ?? "https://aikoboard.com";
const SLUG = process.env.DIAG_SLUG ?? "gvgq";
const prisma = new PrismaClient();

/** Ouvre reellement le formulaire d'inscription et inspecte le bloc services. */
async function main() {
  const evt = await prisma.event.findUnique({
    where: { slug: SLUG },
    select: { statut: true, serviceIds: true },
  });
  if (!evt) return console.log(`evenement ${SLUG} introuvable`);

  const restore = evt.statut !== "actif";
  if (restore) await prisma.event.update({ where: { slug: SLUG }, data: { statut: "actif" } });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
  await page.goto(`${BASE}/fr/evenements/${SLUG}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);

  const boutons = await page.evaluate(() =>
    [...document.querySelectorAll("button")].map((b) => (b.textContent ?? "").trim().replace(/\s+/g, " ")).filter(Boolean),
  );
  console.log("boutons de la page :", boutons.join(" | "));

  // Le bouton qui ouvre le formulaire est le premier gros CTA dore
  const cta = page.locator("button.btn-press").first();
  if (await cta.count()) {
    console.log("clic sur :", (await cta.textContent())?.trim().replace(/\s+/g, " "));
    await cta.click().catch(() => {});
    await page.waitForTimeout(1200);
  }

  const etat = await page.evaluate(() => {
    const champs = [...document.querySelectorAll("input")].length;
    const cases = [...document.querySelectorAll("label")].filter(
      (l) => l.querySelector('input[type="checkbox"]') && /XOF \/|Inclus/.test(l.textContent ?? ""),
    );
    const optIn = [...document.querySelectorAll("label")].find((l) =>
      /Services de conciergerie/i.test(l.textContent ?? ""),
    );
    return {
      formulaireOuvert: champs > 3,
      champs,
      optIn: !!optIn,
      cases: cases.length,
    };
  });

  console.log(`formulaire ouvert : ${etat.formulaireOuvert ? "oui" : "NON"} (${etat.champs} champs)`);
  console.log(`case "Services de conciergerie" : ${etat.optIn ? "presente" : "ABSENTE"}`);
  console.log(`services cochables : ${etat.cases}`);

  // On coche l'option pour verifier que la liste se deplie
  if (etat.optIn) {
    await page.locator("label", { hasText: /Services de conciergerie/i }).first().click().catch(() => {});
    await page.waitForTimeout(600);
    const apres = await page.evaluate(() =>
      [...document.querySelectorAll("label")].filter(
        (l) => l.querySelector('input[type="checkbox"]') && /XOF \/|Inclus/.test(l.textContent ?? ""),
      ).length,
    );
    console.log(`apres avoir coche l'option : ${apres} service(s) affiche(s)`);
  }

  await browser.close();
  if (restore) await prisma.event.update({ where: { slug: SLUG }, data: { statut: evt.statut } });
}

main()
  .catch((e) => console.error("ERREUR:", e.message))
  .finally(() => prisma.$disconnect());
