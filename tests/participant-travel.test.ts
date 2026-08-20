// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseTravelInfo } from "@/lib/participant-travel";

const complet = {
  typeParticipant: "international",
  passeport: "  19AB12345 ",
  paysDepart: "SN",
  numeroVol: "AF703",
  planVol: "Dakar → Abidjan, escale Bamako",
  aVisa: true,
  dateArrivee: "2026-09-14T08:30",
  dateRetour: "2026-09-17T19:45",
};

describe("informations de voyage", () => {
  it("retient tout pour un participant international", () => {
    const v = parseTravelInfo(complet);

    expect(v.typeParticipant).toBe("international");
    expect(v.passeport).toBe("19AB12345");
    expect(v.paysDepart).toBe("SN");
    expect(v.numeroVol).toBe("AF703");
    expect(v.aVisa).toBe(true);
    expect(v.dateArrivee?.getFullYear()).toBe(2026);
    expect(v.dateRetour?.getDate()).toBe(17);
  });

  it("n'enregistre rien pour un participant local", () => {
    // Meme si la requete contient des champs de voyage, ils n'ont pas de sens
    const v = parseTravelInfo({ ...complet, typeParticipant: "local" });

    expect(v.typeParticipant).toBe("local");
    expect(v.passeport).toBeNull();
    expect(v.numeroVol).toBeNull();
    expect(v.dateArrivee).toBeNull();
    expect(v.aVisa).toBeNull();
  });

  it("traite un type absent ou inconnu comme local", () => {
    expect(parseTravelInfo({}).typeParticipant).toBe("local");
    expect(parseTravelInfo({ typeParticipant: "martien" }).typeParticipant).toBe("local");
  });

  it("rejette un pays de depart inconnu", () => {
    expect(parseTravelInfo({ ...complet, paysDepart: "ZZ" }).paysDepart).toBeNull();
    expect(parseTravelInfo({ ...complet, paysDepart: 42 }).paysDepart).toBeNull();
  });

  it("ignore une date invalide plutot que d'enregistrer une valeur fausse", () => {
    const v = parseTravelInfo({ ...complet, dateArrivee: "pas une date", dateRetour: "" });

    expect(v.dateArrivee).toBeNull();
    expect(v.dateRetour).toBeNull();
  });

  it("laisse le visa indetermine quand la question reste sans reponse", () => {
    expect(parseTravelInfo({ ...complet, aVisa: undefined }).aVisa).toBeNull();
    expect(parseTravelInfo({ ...complet, aVisa: "oui" }).aVisa).toBeNull();
    expect(parseTravelInfo({ ...complet, aVisa: false }).aVisa).toBe(false);
  });

  it("borne les champs texte", () => {
    const v = parseTravelInfo({ ...complet, passeport: "X".repeat(200), planVol: "Y".repeat(900) });

    expect(v.passeport).toHaveLength(40);
    expect(v.planVol).toHaveLength(500);
  });

  it("traite une chaine vide comme une absence", () => {
    const v = parseTravelInfo({ ...complet, passeport: "   ", numeroVol: "" });

    expect(v.passeport).toBeNull();
    expect(v.numeroVol).toBeNull();
  });
});
