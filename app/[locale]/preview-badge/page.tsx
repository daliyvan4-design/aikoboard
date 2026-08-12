import { notFound } from "next/navigation";
import BadgePreview from "./badge-preview";

/**
 * Référence de design des badges et tickets : utile en développement,
 * fermée en production.
 *
 * Le garde vit dans un composant serveur pour que la réponse soit un vrai
 * 404 (et non une page 404 servie avec un statut 200, que les moteurs de
 * recherche indexent quand même).
 */
export default function PreviewBadgePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <BadgePreview />;
}
