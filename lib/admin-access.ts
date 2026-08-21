import type { Role } from "@prisma/client";

/**
 * Qui accède à quelle page du back-office.
 *
 * Jusqu'ici, le middleware ne vérifiait que l'authentification : n'importe
 * quel compte connecté pouvait ouvrir n'importe quelle page. Les API, elles,
 * filtrent bien par rôle — le visiteur obtenait donc un écran complet mais
 * vide, criblé de 403. Cette table tranche une bonne fois : elle sert au
 * middleware pour autoriser la page, et au menu latéral pour n'afficher que
 * des liens qui mènent quelque part.
 *
 * Les rôles listés ici doivent rester alignés sur les `requireRole` des
 * routes correspondantes dans app/api/admin.
 */

export const TOUS_LES_ROLES: Role[] = [
  "ADMIN",
  "SUPERVISEUR",
  "CONCIERGE",
  "AGENT_INSTITUTIONNEL",
  "SCANNER",
];

/** Chemin de page → rôles autorisés. Le préfixe suffit (sous-pages incluses). */
export const ADMIN_PAGE_ROLES: { chemin: string; roles: Role[] }[] = [
  // Chacun a son tableau de bord, différent selon le rôle
  { chemin: "/admin/dashboard", roles: TOUS_LES_ROLES },
  // Profil et mot de passe : self-service, tout le monde y a droit
  { chemin: "/admin/parametres", roles: TOUS_LES_ROLES },
  { chemin: "/admin/briefing", roles: ["ADMIN", "SUPERVISEUR", "CONCIERGE"] },
  { chemin: "/admin/commandes", roles: ["ADMIN", "SUPERVISEUR"] },
  { chemin: "/admin/events", roles: ["ADMIN", "SUPERVISEUR", "AGENT_INSTITUTIONNEL"] },
  { chemin: "/admin/residences", roles: ["ADMIN", "SUPERVISEUR"] },
  { chemin: "/admin/tarifs", roles: ["ADMIN", "SUPERVISEUR"] },
  { chemin: "/admin/voyageurs", roles: ["ADMIN", "SUPERVISEUR"] },
  { chemin: "/admin/chauffeurs", roles: ["ADMIN", "SUPERVISEUR"] },
  { chemin: "/admin/rapports", roles: ["ADMIN", "SUPERVISEUR"] },
];

/**
 * Une page inconnue de la table reste ouverte à tout compte connecté : on
 * n'enferme pas l'utilisateur dehors parce qu'une page vient d'être ajoutée
 * et que personne n'a pensé à la déclarer.
 */
export function pageAutorisee(chemin: string, role: string | undefined): boolean {
  const regle = ADMIN_PAGE_ROLES.find(
    (r) => chemin === r.chemin || chemin.startsWith(r.chemin + "/"),
  );
  if (!regle) return true;
  return Boolean(role) && regle.roles.includes(role as Role);
}

/** Rôles autorisés sur une page, pour le menu latéral. */
export function rolesDePage(chemin: string): Role[] {
  return ADMIN_PAGE_ROLES.find((r) => r.chemin === chemin)?.roles ?? TOUS_LES_ROLES;
}
