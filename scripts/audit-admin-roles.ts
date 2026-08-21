import { chromium, type Browser } from "playwright";
import { ADMIN_PAGE_ROLES } from "../lib/admin-access";

/**
 * Audit des droits du back-office, dans un vrai navigateur.
 *
 * Pour chaque compte fourni, le script ouvre toutes les pages d'administration
 * et signale ce qui cloche : redirection, ecran d'erreur, page vide, ou appel
 * d'API refuse. Un 403 dans cette sortie veut dire qu'un role atteint une page
 * qu'il ne peut pas utiliser — exactement le defaut que la table
 * lib/admin-access.ts est la pour empecher.
 *
 *   npx tsx scripts/temp-admins.ts create      # cree des comptes jetables
 *   AUDIT_COMPTES='[{"role":"ADMIN","email":"…","pass":"…"}]' \
 *     npx tsx scripts/audit-admin-roles.ts
 *   npx tsx scripts/temp-admins.ts delete      # et on les retire
 *
 * AUDIT_BASE cible un autre environnement (http://localhost:3000 par defaut
 * de developpement).
 */

const BASE = process.env.AUDIT_BASE ?? "https://aikoboard.com";

interface Compte {
  role: string;
  email: string;
  pass: string;
}

function lireComptes(): Compte[] {
  const brut = process.env.AUDIT_COMPTES;
  if (!brut) {
    console.error(
      "AUDIT_COMPTES manquant.\n" +
        "Lancez d'abord `npx tsx scripts/temp-admins.ts create`, puis passez\n" +
        "le tableau d'identifiants qu'il affiche :\n" +
        "  AUDIT_COMPTES='[{\"role\":\"ADMIN\",\"email\":\"…\",\"pass\":\"…\"}]' \\\n" +
        "    npx tsx scripts/audit-admin-roles.ts",
    );
    process.exit(1);
  }
  const liste = JSON.parse(brut) as (Compte & { password?: string })[];
  return liste.map((c) => ({ role: c.role, email: c.email, pass: c.pass ?? c.password ?? "" }));
}

const PAGES = ADMIN_PAGE_ROLES.map((r) => r.chemin);

async function auditerCompte(b: Browser, compte: Compte) {
  const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 } });
  const p = await ctx.newPage();

  await p.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await p.locator('input[type="email"]').fill(compte.email);
  await p.locator('input[type="password"]').fill(compte.pass);
  await p.locator('button[type="submit"]').click();
  // La premiere connexion peut reveiller une fonction froide : on patiente.
  await p.waitForTimeout(6000);

  if (p.url().includes("/admin/login")) {
    console.log(`\n${compte.role} : CONNEXION IMPOSSIBLE`);
    await ctx.close();
    return;
  }

  console.log(`\n${compte.role} — connecte, atterrit sur ${p.url().replace(BASE, "")}`);

  for (const route of PAGES) {
    const autorise = ADMIN_PAGE_ROLES.find((r) => r.chemin === route)!.roles.includes(
      compte.role as never,
    );

    const echecs: string[] = [];
    const erreurs: string[] = [];
    const onResp = (r: { status: () => number; url: () => string }) => {
      if (r.status() >= 400 && r.url().includes("/api/")) {
        echecs.push(`${r.status()} ${r.url().replace(BASE, "").split("?")[0]}`);
      }
    };
    const onErr = (e: Error) => erreurs.push(e.message.slice(0, 60));
    p.on("response", onResp);
    p.on("pageerror", onErr);

    await p.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" }).catch(() => {});
    await p.waitForTimeout(2200);

    const arrivee = p.url().replace(BASE, "").split("?")[0];
    const texte = await p.locator("body").innerText().catch(() => "");
    const vide = texte.replace(/\s+/g, " ").trim().length < 120;
    const boom = /Une erreur|Something went wrong|Application error/i.test(texte);

    p.off("response", onResp);
    p.off("pageerror", onErr);

    let etat: string;
    if (arrivee !== route) {
      etat = autorise ? `REDIRIGE A TORT -> ${arrivee}` : `refusee (-> ${arrivee})`;
    } else if (!autorise) {
      etat = "ACCESSIBLE ALORS QU ELLE DEVRAIT ETRE REFUSEE";
    } else if (boom) {
      etat = "ECRAN D ERREUR";
    } else if (echecs.length) {
      etat = `API REFUSEE : ${[...new Set(echecs)].join(", ")}`;
    } else {
      etat = vide ? "PAGE VIDE" : "ok";
    }

    console.log(`  ${route.padEnd(22)} ${etat}${erreurs.length ? ` | JS: ${erreurs[0]}` : ""}`);
  }

  await ctx.close();
}

async function main() {
  const comptes = lireComptes();
  const b = await chromium.launch();
  for (const c of comptes) await auditerCompte(b, c);
  await b.close();
}

main().catch((e) => {
  console.error("ERREUR:", e.message);
  process.exitCode = 1;
});
