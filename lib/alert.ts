import { log } from "./logger";

/**
 * Alerte email sur incident critique.
 *
 * Le logger structuré ne sert à rien si personne ne le lit : pour les
 * pannes qui coûtent de l'argent (paiement, webhook), on prévient par email.
 *
 * Deux garde-fous : une alerte identique n'est envoyée qu'une fois par
 * heure, et l'échec de l'alerte ne casse jamais la requête en cours.
 */

const COOLDOWN_MS = 60 * 60 * 1000;
const lastSent = new Map<string, number>();

function shouldSend(key: string, now: number): boolean {
  const previous = lastSent.get(key);
  if (previous !== undefined && now - previous < COOLDOWN_MS) return false;
  lastSent.set(key, now);
  return true;
}

export interface AlertInput {
  /** Regroupe les alertes identiques pour l'anti-spam. */
  key: string;
  title: string;
  details?: Record<string, unknown>;
  error?: unknown;
}

export async function alertCritical(input: AlertInput): Promise<void> {
  log.error(input.title, { action: "alert", alertKey: input.key, ...input.details }, input.error);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!apiKey || !to) return;

  if (!shouldSend(input.key, Date.now())) return;

  const message =
    input.error instanceof Error ? input.error.message : input.error ? String(input.error) : "";

  const rows = Object.entries(input.details ?? {})
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#8A8680">${k}</td><td>${String(v)}</td></tr>`)
    .join("");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "AIKO Board <contact@aikoboard.com>",
        to,
        subject: `[AIKO Board] Incident : ${input.title}`,
        html: `
          <p style="font-family:system-ui,sans-serif">
            <strong>${input.title}</strong><br>
            ${message ? `<code>${message}</code><br>` : ""}
          </p>
          <table style="font-family:system-ui,sans-serif;font-size:13px">${rows}</table>
          <p style="font-family:system-ui,sans-serif;font-size:12px;color:#8A8680">
            Alerte automatique — les incidents identiques sont regroupes sur une heure.
          </p>`,
      }),
    });
  } catch {
    // Une alerte qui echoue ne doit jamais faire echouer la requete.
  }
}
