// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import path from "path";

/**
 * Chaque cle passee a t() doit exister dans l'espace de noms declare par
 * useTranslations. next-intl ne leve pas d'erreur quand elle manque : il
 * affiche "event.page.services_title" a l'ecran, ce qui est passe en
 * production sans que rien ne le signale.
 */

const LOCALES = ["fr", "en", "ar"] as const;

function loadMessages(locale: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join("messages", `${locale}.json`), "utf8"));
}

function resolve(messages: Record<string, unknown>, namespace: string, key: string): boolean {
  const parts = [...namespace.split("."), ...key.split(".")];
  let cur: unknown = messages;
  for (const part of parts) {
    if (typeof cur !== "object" || cur === null) return false;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string";
}

function collectTsx(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!/node_modules|\.next/.test(full)) collectTsx(full, out);
    } else if (full.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

/** Toutes les paires (espace de noms, cle) utilisees dans le code. */
function collectUsages(): { file: string; namespace: string; key: string }[] {
  const usages: { file: string; namespace: string; key: string }[] = [];

  for (const file of [...collectTsx("app"), ...collectTsx("components")]) {
    const src = readFileSync(file, "utf8");
    const namespaces: Record<string, string> = {};
    for (const m of src.matchAll(/const\s+(\w+)\s*=\s*useTranslations\("([^"]+)"\)/g)) {
      namespaces[m[1]] = m[2];
    }
    for (const [fn, namespace] of Object.entries(namespaces)) {
      for (const m of src.matchAll(new RegExp(`\\b${fn}\\("([^"]+)"\\)`, "g"))) {
        usages.push({ file, namespace, key: m[1] });
      }
    }
  }
  return usages;
}

describe("cles de traduction", () => {
  const usages = collectUsages();

  it("trouve des appels a traduire dans le code", () => {
    expect(usages.length).toBeGreaterThan(50);
  });

  it.each(LOCALES)("resout toutes les cles en %s", (locale) => {
    const messages = loadMessages(locale);
    const manquantes = usages
      .filter((u) => !resolve(messages, u.namespace, u.key))
      .map((u) => `${u.namespace}.${u.key} (${u.file})`);

    expect(manquantes).toEqual([]);
  });

  it("garde les trois langues alignees sur les memes cles", () => {
    const aplatir = (obj: Record<string, unknown>, prefix = ""): string[] =>
      Object.entries(obj).flatMap(([k, v]) =>
        typeof v === "object" && v !== null
          ? aplatir(v as Record<string, unknown>, `${prefix}${k}.`)
          : [`${prefix}${k}`],
      );

    const fr = new Set(aplatir(loadMessages("fr")));
    for (const locale of ["en", "ar"] as const) {
      const autres = aplatir(loadMessages(locale));
      const absentes = autres.filter((k) => !fr.has(k));
      expect(absentes, `cles presentes en ${locale} mais pas en fr`).toEqual([]);
    }
  });
});
