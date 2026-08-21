import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.HERO_BASE ?? "http://localhost:3100";
const OUT = process.env.HERO_OUT ?? "/tmp/hero";

/** Capture le hero en bureau et en telephone, pour juger sur pieces. */
async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const vp of [
    { nom: "bureau", width: 1440, height: 900, mobile: false },
    { nom: "telephone", width: 390, height: 844, mobile: true },
  ]) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
    });
    await page.goto(`${BASE}/fr`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    await page.screenshot({ path: path.join(OUT, `hero-${vp.nom}.png`) });

    const mesure = await page.evaluate(() => {
      const stage = document.querySelector(".hero-stage");
      const r = stage?.getBoundingClientRect();
      const doc = document.documentElement;
      return {
        scene: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : "ABSENTE",
        partVisible: r ? Math.round((r.height / window.innerHeight) * 100) : 0,
        debordement: Math.round(doc.scrollWidth - window.innerWidth),
        video: !!document.querySelector(".hero-stage video"),
      };
    });

    console.log(
      `${vp.nom.padEnd(10)} scene ${mesure.scene} · ${mesure.partVisible}% de l'ecran · video ${mesure.video ? "presente" : "absente"} · debordement ${mesure.debordement}px`,
    );
    await page.close();
  }

  await browser.close();
  console.log(`\ncaptures : ${OUT}`);
}

main().catch((e) => {
  console.error("ERREUR:", e.message);
  process.exitCode = 1;
});
