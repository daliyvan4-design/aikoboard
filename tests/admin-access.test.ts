// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pageAutorisee, rolesDePage, ADMIN_PAGE_ROLES } from "@/lib/admin-access";

describe("acces aux pages du back-office", () => {
  it("laisse chaque role sur son tableau de bord et ses parametres", () => {
    for (const role of ["ADMIN", "SUPERVISEUR", "CONCIERGE", "AGENT_INSTITUTIONNEL", "SCANNER"]) {
      expect(pageAutorisee("/admin/dashboard", role)).toBe(true);
      expect(pageAutorisee("/admin/parametres", role)).toBe(true);
    }
  });

  it("ferme l editeur de tarifs au scanner et au concierge", () => {
    expect(pageAutorisee("/admin/tarifs", "SCANNER")).toBe(false);
    expect(pageAutorisee("/admin/tarifs", "CONCIERGE")).toBe(false);
    expect(pageAutorisee("/admin/tarifs", "ADMIN")).toBe(true);
    expect(pageAutorisee("/admin/tarifs", "SUPERVISEUR")).toBe(true);
  });

  it("applique la regle aux sous-pages", () => {
    expect(pageAutorisee("/admin/briefing/cmd_123", "CONCIERGE")).toBe(true);
    expect(pageAutorisee("/admin/briefing/cmd_123", "SCANNER")).toBe(false);
  });

  it("refuse un role absent ou inconnu", () => {
    expect(pageAutorisee("/admin/commandes", undefined)).toBe(false);
    expect(pageAutorisee("/admin/commandes", "INVENTE")).toBe(false);
  });

  it("laisse passer une page non declaree plutot que d enfermer dehors", () => {
    expect(pageAutorisee("/admin/nouvelle-page", "SCANNER")).toBe(true);
  });

  it("l agent institutionnel voit les evenements, pas les commandes", () => {
    expect(pageAutorisee("/admin/events", "AGENT_INSTITUTIONNEL")).toBe(true);
    expect(pageAutorisee("/admin/commandes", "AGENT_INSTITUTIONNEL")).toBe(false);
  });

  it("n autorise jamais une page a personne", () => {
    for (const regle of ADMIN_PAGE_ROLES) {
      expect(regle.roles.length).toBeGreaterThan(0);
      expect(rolesDePage(regle.chemin)).toEqual(regle.roles);
    }
  });
});
