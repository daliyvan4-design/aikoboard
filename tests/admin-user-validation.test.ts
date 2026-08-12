import { describe, it, expect } from "vitest";
import { adminUserSchema } from "@/lib/validation";

const validUser = {
  email: "test@aiko.com",
  nom: "Test User",
  password: "aiko2026!secure",
};

describe("adminUserSchema", () => {
  it("accepts valid user", () => {
    const result = adminUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("defaults role to undefined when not provided", () => {
    const result = adminUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBeUndefined();
    }
  });

  it("accepts all valid roles", () => {
    for (const role of ["ADMIN", "SUPERVISEUR", "CONCIERGE", "AGENT_INSTITUTIONNEL", "SCANNER"]) {
      const result = adminUserSchema.safeParse({ ...validUser, role });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid role", () => {
    const result = adminUserSchema.safeParse({ ...validUser, role: "SUPER_ADMIN" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = adminUserSchema.safeParse({ ...validUser, email: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects empty nom", () => {
    const result = adminUserSchema.safeParse({ ...validUser, nom: "" });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than the minimum", () => {
    const result = adminUserSchema.safeParse({ ...validUser, password: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects password longer than 128 chars", () => {
    const result = adminUserSchema.safeParse({ ...validUser, password: "a".repeat(129) });
    expect(result.success).toBe(false);
  });

  it("rejects a 6-char password (minimum releve a 10)", () => {
    const result = adminUserSchema.safeParse({ ...validUser, password: "123456" });
    expect(result.success).toBe(false);
  });

  it("accepts a 10-char password", () => {
    const result = adminUserSchema.safeParse({ ...validUser, password: "0123456789" });
    expect(result.success).toBe(true);
  });

  it("rejects email longer than 255 chars", () => {
    const result = adminUserSchema.safeParse({ ...validUser, email: "a".repeat(250) + "@b.com" });
    expect(result.success).toBe(false);
  });

  it("rejects nom longer than 100 chars", () => {
    const result = adminUserSchema.safeParse({ ...validUser, nom: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});
