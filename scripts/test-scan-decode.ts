import { chromium } from "playwright";
import { execFileSync } from "child_process";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import QRCode from "qrcode";

const BASE = process.env.SCAN_BASE ?? "https://aikoboard.com";
const TOKEN = process.env.SCAN_TOKEN ?? "";
const SLUG = process.env.SCAN_SLUG ?? "aiko-event-manager";
/** Reference volontairement inexistante : le decodage est prouve par
 *  l'appel API, sans modifier aucune inscription reelle. */
const REF = process.env.SCAN_REF ?? "AIKO-00000000";

/**
 * Fabrique un flux video contenant un QR code et le presente au navigateur
 * comme une camera. C'est le seul moyen de verifier que la page decode
 * reellement, sans telephone dans la main.
 */
async function main() {
  const dir = mkdtempSync(path.join(tmpdir(), "scan-"));
  const png = path.join(dir, "qr.png");
  const y4m = path.join(dir, "qr.y4m");

  const payload = JSON.stringify({
    ref: REF,
    event: "AIKO Event Manager",
    name: "Test Decode",
    type: "badge",
    ticket: 99,
  });
  await QRCode.toFile(png, payload, { width: 400, margin: 2 });

  // QR centre sur un fond blanc 640x480, comme une camera de telephone
  execFileSync("ffmpeg", [
    "-y", "-loop", "1", "-i", png, "-t", "12", "-r", "15",
    "-vf", "pad=640:480:(ow-iw)/2:(oh-ih)/2:white",
    "-pix_fmt", "yuv420p", "-f", "yuv4mpegpipe", y4m,
  ], { stdio: "ignore" });

  const browser = await chromium.launch({
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      `--use-file-for-fake-video-capture=${y4m}`,
    ],
  });

  for (const vp of [
    { name: "telephone 375x667", width: 375, height: 667, mobile: true },
    { name: "bureau 1280x800", width: 1280, height: 800, mobile: false },
  ]) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      permissions: ["camera"],
    });
    const page = await context.newPage();

    const calls: string[] = [];
    page.on("response", (r) => {
      if (r.url().includes("/checkin")) calls.push(`${r.status()}`);
    });

    await page.goto(`${BASE}/fr/scan/${SLUG}?token=${TOKEN}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const start = page.locator("button", { hasText: /scanner|démarrer|demarrer/i }).first();
    if (await start.count()) await start.click();

    // Laisse le temps au decodeur de travailler
    await page.waitForTimeout(9000);

    const shown = await page.evaluate(() => {
      const lines = document.body.innerText.split("\n").map((l) => l.trim()).filter(Boolean);
      const i = lines.findIndex((l) => /introuvable|refus|erreur|deja|non authentifi/i.test(l));
      return i >= 0 ? lines.slice(i, i + 2).join(" / ") : "aucune reaction";
    });

    console.log(`\n${vp.name}`);
    console.log(`  appel de check-in : ${calls.length ? calls.join(", ") : "AUCUN — le QR n'a pas ete decode"}`);
    console.log(`  message a l'ecran : ${shown}`);

    await context.close();
  }

  await browser.close();
}

main().catch((e) => {
  console.error("ERREUR:", e.message);
  process.exitCode = 1;
});
