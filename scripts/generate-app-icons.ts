import { chromium } from "playwright";
import path from "path";

/**
 * Genere le jeu d'icones de l'application a partir de l'identite AIKO :
 * fond encre, monogramme dore en Playfair Display.
 *
 * Trois formats, trois usages distincts :
 *  - icon-192 / icon-512 : icones classiques du manifeste
 *  - icon-maskable-512   : Android recadre l'icone en cercle ou en goutte,
 *                          le monogramme est donc reduit pour tenir dans la
 *                          zone de securite (80 % du canevas)
 *  - apple-touch-icon    : iOS ignore le manifeste et arrondit lui-meme les
 *                          coins ; la transparence y devient noire
 */

const INK = "#0A0A0A";
const GOLD = "#C8A951";
const OUT = path.join(process.cwd(), "public");

/** ratio : part de la hauteur occupee par le monogramme */
function html(ratio: number, withRing: boolean): string {
  return `<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
<style>
  html, body { margin: 0; padding: 0; }
  .canvas {
    width: 512px; height: 512px;
    background: ${INK};
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .ring {
    position: absolute; inset: 46px;
    border: 6px solid ${GOLD}33;
    border-radius: 999px;
  }
  .mark {
    font-family: "Playfair Display", Georgia, serif;
    font-weight: 700;
    color: ${GOLD};
    font-size: ${Math.round(512 * ratio)}px;
    line-height: 1;
    letter-spacing: 0.02em;
    /* centrage optique : le A serif porte plus de matiere en bas */
    transform: translateY(-2%);
  }
</style></head>
<body><div class="canvas">${withRing ? '<div class="ring"></div>' : ""}<span class="mark">A</span></div></body></html>`;
}

async function main() {
  const browser = await chromium.launch();

  const variants = [
    { file: "icon-512.png", size: 512, ratio: 0.58, ring: true },
    { file: "icon-192.png", size: 192, ratio: 0.58, ring: true },
    // Zone de securite Android : le monogramme doit survivre a un recadrage circulaire
    { file: "icon-maskable-512.png", size: 512, ratio: 0.42, ring: false },
    { file: "apple-touch-icon.png", size: 180, ratio: 0.58, ring: true },
  ];

  for (const v of variants) {
    const scale = v.size / 512;
    const page = await browser.newPage({
      viewport: { width: 512, height: 512 },
      deviceScaleFactor: scale,
    });
    await page.setContent(html(v.ratio, v.ring), { waitUntil: "networkidle" });
    await page.waitForTimeout(400); // chargement de la police
    await page.locator(".canvas").screenshot({ path: path.join(OUT, v.file) });
    await page.close();
    console.log(`${v.file.padEnd(24)} ${v.size}x${v.size}`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error("ERREUR:", e.message);
  process.exitCode = 1;
});
