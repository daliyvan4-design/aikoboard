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
  type: z.enum(["badge", "ticket"]).optional(),
  statut: z.enum(["confirme", "pending", "annule"]).optional(),
  montant: z.number().min(0).optional(),
  paymentRef: z.string().optional(),
  residenceTarifId: z.string().nullable().optional(),
});

export type ParticipantInput = z.infer<typeof participantSchema>;

export const adminUserSchema = z.object({
  email: z.string().email().max(255),
  nom: z.string().min(1).max(100),
  password: z.string().min(6).max(128),
  role: z.enum(["ADMIN", "SUPERVISEUR", "CONCIERGE", "AGENT_INSTITUTIONNEL", "SCANNER"]).optional(),
});

export type AdminUserInput = z.infer<typeof adminUserSchema>;
