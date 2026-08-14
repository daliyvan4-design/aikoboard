import { chromium, type Page } from "playwright";
import { mkdirSync } from "fs";

/**
 * Audit de responsive telephone.
 *
 * Le critere objectif : la page ne doit jamais deborder horizontalement.
 * Un debordement force l'utilisateur a scroller lateralement, ce qui casse
 * la lecture et decale les boutons hors de l'ecran. On identifie aussi les
 * elements fautifs pour pouvoir corriger, et on mesure les zones tactiles
 * trop petites (< 32 px) qui rendent les boutons difficiles a viser.
 */

const BASE = process.env.AUDIT_BASE ?? "https://aikoboard.com";
const TOKEN = process.env.AUDIT_TOKEN ?? "";
const SHOTS = process.env.AUDIT_SHOTS ?? "/tmp/mobile-audit";

const VIEWPORTS = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "petit Android", width: 360, height: 740 },
];

const PAGES: { path: string; label: string }[] = [
  { path: "/fr", label: "accueil" },
  { path: "/en", label: "accueil (en)" },
  { path: "/ar", label: "accueil (ar, RTL)" },
  { path: "/fr/evenements", label: "liste des evenements" },
  { path: "/fr/evenements/aiko-event-manager", label: "fiche evenement" },
  { path: "/fr/evenements/creer", label: "creation d'evenement" },
  { path: "/fr/residences", label: "residences" },
  { path: "/fr/residences/cms0y5vty000h9kguxj5ckfws", label: "fiche residence" },
  { path: "/fr/services", label: "services" },
  { path: "/fr/salon", label: "salon" },
  { path: "/fr/assistance", label: "assistance" },
  { path: "/fr/reservation", label: "reservation" },
  { path: "/fr/mon-qr", label: "mon QR" },
  { path: "/fr/paiement/succes", label: "paiement reussi" },
  { path: "/fr/paiement/echec", label: "paiement echoue" },
  { path: "/fr/cgu", label: "CGU" },
  { path: "/fr/confidentialite", label: "confidentialite" },
  { path: "/fr/mentions-legales", label: "mentions legales" },
  { path: "/admin/login", label: "connexion admin" },
  ...(TOKEN
    ? [
        { path: `/fr/organisateur/aiko-event-manager?token=${TOKEN}`, label: "tableau de bord organisateur" },
        { path: `/fr/scan/aiko-event-manager?token=${TOKEN}`, label: "scan des badges" },
      ]
    : []),
];

interface Offender {
  selector: string;
  right: number;
  width: number;
  text: string;
}

async function inspect(page: Page, width: number) {
  return page.evaluate((vw) => {
    const doc = document.documentElement;
    const overflow = Math.round(doc.scrollWidth - vw);

    const offenders: Offender[] = [];
    if (overflow > 1) {
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right <= vw + 1 && r.left >= -1) continue;
        // On ne garde que les elements qui debordent vraiment, pas leurs parents
        if (el.querySelector("*") && r.width < vw) continue;

        const cls = typeof el.className === "string" ? el.className.slice(0, 60) : "";
        offenders.push({
          selector: `${el.tagName.toLowerCase()}${cls ? `.${cls.trim().split(/\s+/).join(".")}` : ""}`,
          right: Math.round(r.right),
          width: Math.round(r.width),
          text: (el.textContent ?? "").trim().slice(0, 40),
        });
      }
    }

    // Zones tactiles trop petites
    const small: string[] = [];
    for (const el of Array.from(
      document.querySelectorAll<HTMLElement>("a, button, input, select, [role=button]"),
    )) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.height < 32) {
        const label = (el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 30);
        if (label) small.push(`${label} (${Math.round(r.height)}px)`);
      }
    }

    return { overflow, offenders: offenders.slice(0, 5), small: [...new Set(small)].slice(0, 5) };
  }, width);
}

async function main() {
  mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  let problems = 0;

  for (const vp of VIEWPORTS) {
    console.log(`\n===== ${vp.name} (${vp.width} px) =====`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });

    for (const { path, label } of PAGES) {
      const page = await context.newPage();
      try {
        const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45_000 });
        await page.waitForTimeout(700);

        const { overflow, offenders, small } = await inspect(page, vp.width);
        const status = res?.status() ?? 0;
        const ok = overflow <= 1;
        if (!ok) problems++;

        console.log(
          `${ok ? "OK   " : "LARGE"} | ${label.padEnd(30)} | ${String(status)} | debordement ${overflow > 1 ? `+${overflow}px` : "aucun"}`,
        );
        for (const o of offenders) {
          console.log(`        -> ${o.selector} (largeur ${o.width}px, bord droit ${o.right}px) "${o.text}"`);
        }
        if (small.length) console.log(`        cibles tactiles < 32px : ${small.join(", ")}`);

        if (!ok) {
          const name = label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
          await page.screenshot({
            path: `${SHOTS}/${vp.width}-${name}.png`,
            fullPage: true,
          });
        }
      } catch (err) {
        problems++;
        console.log(`ERREUR| ${label.padEnd(30)} | ${(err as Error).message.split("\n")[0]}`);
      } finally {
        await page.close();
      }
    }
    await context.close();
  }

  await browser.close();
  console.log(`\npages en debordement : ${problems}`);
  console.log(`captures des pages fautives : ${SHOTS}`);
}

main().catch((e) => {
  console.error("ERREUR:", e);
  process.exitCode = 1;
});
