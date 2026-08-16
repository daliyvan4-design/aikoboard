import { chromium } from "playwright";
import QRCode from "qrcode";
import path from "path";

/**
 * Maquettes de badge au format carte CR80 (85,6 x 54 mm, ratio 1,585).
 * Rendues en image pour comparer les partis pris avant de les porter
 * dans le generateur PDF.
 */

const OUT = process.env.MOCKUP_OUT ?? "/tmp/badges";
const W = 856;
const H = 540;

const INK = "#0A1628";
const GOLD = "#C8A951";
const CREAM = "#F7F5F0";

const P = {
  name: "Amadou Diallo",
  titre: "Managing Director",
  org: "AIKO Group International",
  ref: "AIKO-76EE3F40",
  num: "0042",
  event: "AIKO Event Manager",
  date: "15 – 16 septembre 2026",
  lieu: "Sofitel Hôtel Ivoire · Abidjan",
};

function page(body: string, extraCss = ""): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Inter, system-ui, sans-serif; }
  .card { width:${W}px; height:${H}px; overflow:hidden; position:relative; }
  .serif { font-family:"Playfair Display", Georgia, serif; }
  ${extraCss}
</style></head><body>${body}</body></html>`;
}

/** A — Colonne doree : hierarchie verticale, QR isole a droite */
function variantA(qr: string) {
  return page(`
  <div class="card" style="background:${INK};display:flex">
    <div style="width:14px;background:linear-gradient(180deg,${GOLD},#8d7431)"></div>
    <div style="flex:1;padding:38px 34px;display:flex;flex-direction:column;justify-content:space-between">
      <div>
        <p style="font-size:15px;letter-spacing:.24em;text-transform:uppercase;color:rgba(255,255,255,.42)">${P.event}</p>
        <p style="font-size:13px;color:rgba(255,255,255,.28);margin-top:6px">${P.date}</p>
      </div>
      <div>
        <p class="serif" style="font-size:58px;color:#fff;line-height:1.05">${P.name}</p>
        <p style="font-size:17px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${GOLD};margin-top:12px">${P.titre}</p>
        <p style="font-size:17px;color:rgba(255,255,255,.5);margin-top:6px">${P.org}</p>
      </div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between">
        <p style="font-size:12px;color:rgba(255,255,255,.3)">${P.lieu}</p>
        <p style="font-size:12px;letter-spacing:.2em;color:rgba(255,255,255,.25)">AIKO BOARD</p>
      </div>
    </div>
    <div style="width:250px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px">
      <img src="${qr}" style="width:180px;height:180px">
      <p style="font-family:ui-monospace,monospace;font-size:15px;color:${INK};letter-spacing:.04em">${P.ref}</p>
      <p class="serif" style="font-size:30px;color:${GOLD}">N°${P.num}</p>
    </div>
  </div>`);
}

/** B — Photo pleine hauteur : pour les conferences avec trombinoscope */
function variantB(qr: string) {
  return page(`
  <div class="card" style="background:${INK};display:flex">
    <div style="width:230px;background:linear-gradient(160deg,#1e2d41,#0a1628);display:flex;align-items:center;justify-content:center;border-right:2px solid ${GOLD}">
      <div style="width:150px;height:180px;border:2px solid ${GOLD};display:flex;align-items:center;justify-content:center">
        <span style="font-size:13px;letter-spacing:.2em;color:rgba(255,255,255,.35)">PHOTO</span>
      </div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column">
      <div style="background:${GOLD};padding:12px 30px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:15px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${INK}">${P.event}</span>
        <span style="font-size:13px;font-weight:600;color:rgba(10,22,40,.7)">${P.date}</span>
      </div>
      <div style="flex:1;padding:30px;display:flex;align-items:center;justify-content:space-between;gap:24px">
        <div style="min-width:0">
          <p class="serif" style="font-size:50px;color:#fff;line-height:1.05">${P.name}</p>
          <p style="font-size:16px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:${GOLD};margin-top:10px">${P.titre}</p>
          <p style="font-size:16px;color:rgba(255,255,255,.5);margin-top:6px">${P.org}</p>
          <p style="font-size:12px;color:rgba(255,255,255,.28);margin-top:18px">${P.lieu}</p>
        </div>
        <div style="text-align:center;flex-shrink:0">
          <div style="background:#fff;padding:10px;border-radius:6px"><img src="${qr}" style="width:140px;height:140px;display:block"></div>
          <p style="font-family:ui-monospace,monospace;font-size:12px;color:rgba(255,255,255,.5);margin-top:8px">${P.ref}</p>
        </div>
      </div>
    </div>
  </div>`);
}

/** C — Carte claire : contraste maximal pour le scan, encre economisee */
function variantC(qr: string) {
  return page(`
  <div class="card" style="background:${CREAM};position:relative;padding:36px 40px;display:flex;flex-direction:column;justify-content:space-between">
    <div style="position:absolute;top:0;left:0;right:0;height:8px;background:${GOLD}"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <p style="font-size:14px;letter-spacing:.22em;text-transform:uppercase;color:#8A8680">${P.event}</p>
        <p style="font-size:13px;color:#A8A49C;margin-top:5px">${P.date}</p>
      </div>
      <p class="serif" style="font-size:26px;color:${GOLD};letter-spacing:.04em">AIKO</p>
    </div>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:28px">
      <div style="min-width:0">
        <p class="serif" style="font-size:56px;color:${INK};line-height:1.05">${P.name}</p>
        <div style="width:64px;height:3px;background:${GOLD};margin:14px 0"></div>
        <p style="font-size:17px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#5A5750">${P.titre}</p>
        <p style="font-size:17px;color:#8A8680;margin-top:5px">${P.org}</p>
      </div>
      <div style="text-align:center;flex-shrink:0">
        <img src="${qr}" style="width:170px;height:170px;display:block">
        <p style="font-family:ui-monospace,monospace;font-size:13px;color:#8A8680;margin-top:8px">${P.ref}</p>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #E8E6E1;padding-top:12px">
      <p style="font-size:12px;color:#A8A49C">${P.lieu}</p>
      <p class="serif" style="font-size:22px;color:${INK}">N°${P.num}</p>
    </div>
  </div>`);
}

async function main() {
  // QR noir sur blanc : c'est le contraste que les lecteurs attendent
  const qr = await QRCode.toDataURL(
    JSON.stringify({ ref: P.ref, event: P.event, name: P.name, type: "badge", ticket: 42 }),
    { width: 600, margin: 0, color: { dark: "#0A1628", light: "#FFFFFF" } },
  );

  const browser = await chromium.launch();
  const variants = [
    { file: "badge-A-colonne-doree.png", html: variantA(qr) },
    { file: "badge-B-photo.png", html: variantB(qr) },
    { file: "badge-C-claire.png", html: variantC(qr) },
  ];

  for (const v of variants) {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
    await page.setContent(v.html, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.locator(".card").screenshot({ path: path.join(OUT, v.file) });
    await page.close();
    console.log(v.file);
  }
  await browser.close();
}

main().catch((e) => {
  console.error("ERREUR:", e.message);
  process.exitCode = 1;
});
