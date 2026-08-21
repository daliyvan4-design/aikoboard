import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.HERO_BASE ?? "https://aikoboard.com";
const OUT = process.env.HERO_OUT ?? "/tmp/hero-video";

/** La video se charge-t-elle et joue-t-elle vraiment, sur les deux formats ? */
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

    const reponses: string[] = [];
    page.on("response", (r) => {
      if (/\/videos\//.test(r.url())) reponses.push(`${r.status()} ${r.url().split("/").pop()}`);
    });

    await page.goto(`${BASE}/fr`, { waitUntil: "networkidle" });
    // Laisse le temps a la lecture de demarrer
    await page.waitForTimeout(4000);

    const etat = await page.evaluate(() => {
      const v = document.querySelector<HTMLVideoElement>(".hero-stage video");
      if (!v) return null;
      return {
        dimensions: `${v.videoWidth}x${v.videoHeight}`,
        enLecture: !v.paused && !v.ended,
        avance: Number(v.currentTime.toFixed(1)),
        // readyState 4 = assez de donnees pour jouer jusqu'au bout
        pret: v.readyState,
        poster: v.poster.split("/").pop(),
      };
    });

    console.log(
      etat
        ? `${vp.nom.padEnd(10)} ${etat.dimensions} · lecture ${etat.enLecture ? "oui" : "NON"} · ${etat.avance}s ecoulees · readyState ${etat.pret} · poster ${etat.poster}`
        : `${vp.nom.padEnd(10)} AUCUNE VIDEO`,
    );
    console.log(`           requetes : ${reponses.join(", ") || "aucune"}`);

    await page.screenshot({ path: path.join(OUT, `video-${vp.nom}.png`) });
    await page.close();
  }

  await browser.close();
  console.log(`\ncaptures : ${OUT}`);
}

main().catch((e) => {
  console.error("ERREUR:", e.message);
  process.exitCode = 1;
});
