import { chromium, type Page, type BrowserContext } from "playwright";
import { mkdirSync } from "fs";

/**
 * Audit responsive du back-office : meme critere que l'audit public
 * (aucun debordement horizontal), mais derriere l'authentification.
 *
 * Les identifiants sont passes par AUDIT_ACCOUNTS (JSON) pour qu'aucun mot
 * de passe ne se retrouve dans le depot.
 */

const BASE = process.env.AUDIT_BASE ?? "https://aikoboard.com";
const SHOTS = process.env.AUDIT_SHOTS ?? "/tmp/admin-audit";
const ACCOUNTS: { email: string; password: string; role: string }[] = JSON.parse(
  process.env.AUDIT_ACCOUNTS ?? "[]",
);

const VIEWPORTS = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "petit Android", width: 360, height: 740 },
];

/** Pages visitees avec le compte ADMIN, qui a acces a tout. */
const ADMIN_PAGES = [
  "/admin/dashboard",
  "/admin/commandes",
  "/admin/voyageurs",
  "/admin/chauffeurs",
  "/admin/events",
  "/admin/residences",
  "/admin/tarifs",
  "/admin/rapports",
  "/admin/briefing",
  "/admin/parametres",
];

async function login(context: BrowserContext, email: string, password: string): Promise<boolean> {
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.includes("/admin/login"), { timeout: 30_000 }),
      page.click('button[type="submit"]'),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    await page.close();
  }
}

async function inspect(page: Page, width: number) {
  return page.evaluate((vw) => {
    const overflow = Math.round(document.documentElement.scrollWidth - vw);
    const offenders: { selector: string; width: number; right: number; text: string }[] = [];

    if (overflow > 1) {
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right <= vw + 1 && r.left >= -1) continue;
        if (el.querySelector("*") && r.width < vw) continue;
        const cls = typeof el.className === "string" ? el.className.slice(0, 55) : "";
        offenders.push({
          selector: `${el.tagName.toLowerCase()}${cls ? `.${cls.trim().split(/\s+/).join(".")}` : ""}`,
          width: Math.round(r.width),
          right: Math.round(r.right),
          text: (el.textContent ?? "").trim().slice(0, 35),
        });
      }
    }
    return { overflow, offenders: offenders.slice(0, 4) };
  }, width);
}

async function auditPages(context: BrowserContext, paths: string[], width: number, tag: string) {
  let problems = 0;
  for (const path of paths) {
    const page = await context.newPage();
    try {
      const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45_000 });
      await page.waitForTimeout(800);
      const { overflow, offenders } = await inspect(page, width);
      const ok = overflow <= 1;
      if (!ok) problems++;

      console.log(
        `${ok ? "OK   " : "LARGE"} | ${path.padEnd(24)} | ${res?.status() ?? 0} | ${ok ? "aucun debordement" : `+${overflow}px`}`,
      );
      for (const o of offenders) {
        console.log(`        -> ${o.selector} (l=${o.width}px, droite=${o.right}px) "${o.text}"`);
      }
      if (!ok) {
        await page.screenshot({
          path: `${SHOTS}/${width}-${tag}-${path.replace(/\//g, "_")}.png`,
          fullPage: true,
        });
      }
    } catch (err) {
      problems++;
      console.log(`ERREUR| ${path.padEnd(24)} | ${(err as Error).message.split("\n")[0]}`);
    } finally {
      await page.close();
    }
  }
  return problems;
}

async function main() {
  if (ACCOUNTS.length === 0) {
    console.error("AUDIT_ACCOUNTS manquant");
    process.exitCode = 1;
    return;
  }

  mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  let problems = 0;

  const admin = ACCOUNTS.find((a) => a.role === "ADMIN")!;
  const others = ACCOUNTS.filter((a) => a.role !== "ADMIN");

  for (const vp of VIEWPORTS) {
    console.log(`\n===== ${vp.name} (${vp.width} px) =====`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    if (!(await login(context, admin.email, admin.password))) {
      console.log("ECHEC de connexion ADMIN — audit interrompu");
      await context.close();
      break;
    }
    console.log(`connecte en ADMIN\n`);
    problems += await auditPages(context, ADMIN_PAGES, vp.width, "admin");
    await context.close();

    // Le tableau de bord change selon le role : un passage par role.
    for (const account of others) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      });
      if (await login(ctx, account.email, account.password)) {
        console.log(`\nconnecte en ${account.role}`);
        problems += await auditPages(ctx, ["/admin/dashboard"], vp.width, account.role.toLowerCase());
      } else {
        console.log(`\nECHEC de connexion ${account.role}`);
        problems++;
      }
      await ctx.close();
    }
  }

  await browser.close();
  console.log(`\npages en debordement : ${problems}`);
  console.log(`captures : ${SHOTS}`);
}

main().catch((e) => {
  console.error("ERREUR:", e);
  process.exitCode = 1;
});
