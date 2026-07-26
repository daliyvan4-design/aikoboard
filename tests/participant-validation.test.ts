import { describe, it, expect } from "vitest";
import { participantSchema } from "@/lib/validation";

const validParticipant = {
  prenom: "Aminata",
  nom: "Koné",
  email: "aminata@test.com",
  telephone: "+2250701020304",
};

describe("participantSchema", () => {
  it("accepts minimal valid participant", () => {
    const result = participantSchema.safeParse(validParticipant);
    expect(result.success).toBe(true);
  });

  it("accepts full participant with all optional fields", () => {
    const result = participantSchema.safeParse({
      ...validParticipant,
      telephone: "+2250701020304",
      organisation: "AIKO Corp",
      type: "badge",
      statut: "confirme",
      montant: 5000,
      paymentRef: "PAY-123",
      residenceTarifId: "tarif-abc",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty prenom", () => {
    const result = participantSchema.safeParse({ ...validParticipant, prenom: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty nom", () => {
    const result = participantSchema.safeParse({ ...validParticipant, nom: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = participantSchema.safeParse({ ...validParticipant, email: "not-valid" });
    expect(result.success).toBe(false);
  });

  it("rejects prenom over 100 chars", () => {
    const result = participantSchema.safeParse({ ...validParticipant, prenom: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = participantSchema.safeParse({ ...validParticipant, type: "vip" });
    expect(result.success).toBe(false);
  });

  it("accepts ticket type", () => {
    const result = participantSchema.safeParse({ ...validParticipant, type: "ticket" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid statut", () => {
    const result = participantSchema.safeParse({ ...validParticipant, statut: "unknown" });
    expect(result.success).toBe(false);
  });

  it("accepts pending statut", () => {
    const result = participantSchema.safeParse({ ...validParticipant, statut: "pending" });
    expect(result.success).toBe(true);
  });

  it("rejects negative montant", () => {
    const result = participantSchema.safeParse({ ...validParticipant, montant: -100 });
    expect(result.success).toBe(false);
  });

  it("accepts null residenceTarifId", () => {
    const result = participantSchema.safeParse({ ...validParticipant, residenceTarifId: null });
    expect(result.success).toBe(true);
  });

  it("rejects telephone shorter than 5 chars", () => {
    const result = participantSchema.safeParse({ ...validParticipant, telephone: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects missing telephone", () => {
    const { telephone, ...rest } = validParticipant;
    const result = participantSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
