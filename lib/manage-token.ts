"use client";

/**
 * Mémorisation locale du token de gestion d'un événement.
 *
 * L'organisateur reçoit son lien privé par email ; on en garde une copie
 * dans le navigateur qui a créé l'événement pour qu'il retrouve son tableau
 * de bord sans repasser par sa boîte mail.
 */

const PREFIX = "aiko:manage:";

export function storeManageToken(slug: string, token: string): void {
  if (typeof window === "undefined" || !slug || !token) return;
  try {
    window.localStorage.setItem(PREFIX + slug, token);
  } catch {
    // mode privé / quota : le lien email reste la source de vérité
  }
}

export function loadManageToken(slug: string): string {
  if (typeof window === "undefined" || !slug) return "";
  try {
    return window.localStorage.getItem(PREFIX + slug) ?? "";
  } catch {
    return "";
  }
}

export function clearManageToken(slug: string): void {
  if (typeof window === "undefined" || !slug) return;
  try {
    window.localStorage.removeItem(PREFIX + slug);
  } catch {
    // ignore
  }
}
