import { chromium } from "playwright";

const BASE = process.env.SCAN_BASE ?? "http://localhost:3100";
const TOKEN = process.env.SCAN_TOKEN ?? "";
const SLUG = process.env.SCAN_SLUG ?? "aiko-event-manager";

/** Le flux video demarre-t-il, et que dit la page en cas d'echec ? */
async function main() {
  const browser = await chromium.launch({
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true,
    permissions: ["camera"],
  });
  const page = await context.newPage();

  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 160));
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 160)}`));

  await page.goto(`${BASE}/fr/scan/${SLUG}?token=${TOKEN}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const btn = page.locator("button", { hasText: /scanner|démarrer|demarrer/i }).first();
  if (await btn.count()) await btn.click();
  await page.waitForTimeout(4000);

  const state = await page.evaluate(() => {
    const v = document.querySelector<HTMLVideoElement>("#qr-reader video");
    const body = document.body.innerText;
    return {
      video: v ? `${v.videoWidth}x${v.videoHeight} lecture:${!v.paused}` : "AUCUNE VIDEO",
      erreur: body.match(/Camera indisponible[\s\S]{0,140}/)?.[0]?.replace(/\n/g, " / ") ?? "aucune",
    };
  });

  console.log("flux video :", state.video);
  console.log("message    :", state.erreur);
  console.log("erreurs JS :", errors.slice(0, 3).join(" | ") || "aucune");

  await browser.close();
}

main().catch((e) => {
  console.error("ERREUR:", e.message);
  process.exitCode = 1;
});
