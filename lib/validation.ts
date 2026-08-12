import { z } from "zod";

export const ligneSchema = z.object({
  serviceId: z.string().min(1),
  tarifId: z.string().nullable().optional(),
  quantite: z.number().int().min(1),
});

export const commandeSchema = z.object({
  voyageur: z.object({
    prenom: z.string().min(1),
    nom: z.string().min(1),
    email: z.string().email(),
    telephone: z.string().min(5),
    nationalite: z.string().min(1),
    dateArrivee: z.string().refine((d) => !isNaN(Date.parse(d))),
    dateDepart: z.string().refine((d) => !isNaN(Date.parse(d))),
    nombrePersonnes: z.number().int().min(1).max(20),
    compagnie: z.string().optional(),
    numeroVol: z.string().optional(),
    heureArrivee: z.string().optional(),
    aeroport: z.string().optional(),
    passeport: z.string().optional(),
    typeVisa: z.string().optional(),
    statutVisa: z.string().optional(),
    notes: z.string().optional(),
  }),
  lignes: z.array(ligneSchema).min(1),
  devise: z.enum(["XOF", "EUR", "USD"]).default("XOF"),
  langue: z.enum(["fr", "en", "ar"]).default("fr"),
  typeReservation: z.enum(["NORMALE", "INSTITUTIONNELLE"]).default("NORMALE"),
});

export type CommandeInput = z.infer<typeof commandeSchema>;

export const participantSchema = z.object({
  prenom: z.string().min(1).max(100),
  nom: z.string().min(1).max(100),
  email: z.string().email().max(255),
  telephone: z.string().min(5).max(30),
  organisation: z.string().max(200).optional(),
  titre: z.string().max(200).optional(),
  photoUrl: z.string().url().max(500).optional(),
  type: z.enum(["badge", "ticket"]).optional(),
  statut: z.enum(["confirme", "pending", "annule"]).optional(),
  montant: z.number().min(0).optional(),
  paymentRef: z.string().optional(),
  residenceTarifId: z.string().nullable().optional(),
});

export type ParticipantInput = z.infer<typeof participantSchema>;

/**
 * Longueur minimale d'un mot de passe back-office. Ces comptes voient les
 * coordonnées de tous les clients : 6 caractères ne suffisent pas.
 */
export const MIN_PASSWORD_LENGTH = 10;

export const adminUserSchema = z.object({
  email: z.string().email().max(255),
  nom: z.string().min(1).max(100),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(128),
  role: z.enum(["ADMIN", "SUPERVISEUR", "CONCIERGE", "AGENT_INSTITUTIONNEL", "SCANNER"]).optional(),
});

export type AdminUserInput = z.infer<typeof adminUserSchema>;

// ─── Images envoyées en data-URI (inscription publique) ──────────────

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export type DataUriCheck =
  | { ok: true; mime: string; bytes: number }
  | { ok: false; error: string };

/**
 * Valide une image envoyée en data-URI : format, type MIME et taille réelle
 * après décodage base64 — les mêmes garde-fous que /api/upload, que ce
 * chemin contournait jusqu'ici.
 */
export function checkDataUriImage(value: unknown): DataUriCheck {
  if (typeof value !== "string") return { ok: false, error: "Photo invalide" };

  const match = /^data:([a-z0-9.+/-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(value.trim());
  if (!match) return { ok: false, error: "Photo invalide (data-URI base64 attendu)" };

  const mime = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.includes(mime)) {
    return { ok: false, error: "Format non supporte (JPG, PNG ou WebP)" };
  }

  const b64 = match[2];
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((b64.length * 3) / 4) - padding;

  if (bytes <= 0) return { ok: false, error: "Photo vide" };
  if (bytes > MAX_IMAGE_BYTES) return { ok: false, error: "Photo trop volumineuse (max 5 Mo)" };

  return { ok: true, mime, bytes };
}
