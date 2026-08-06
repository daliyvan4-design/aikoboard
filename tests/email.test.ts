import { describe, it, expect, vi, beforeEach } from "vitest";

describe("email utility", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("isEmailConfigured returns false when RESEND_API_KEY is not set", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { isEmailConfigured } = await import("@/lib/email");
    expect(isEmailConfigured()).toBe(false);
  });

  it("isEmailConfigured returns true when RESEND_API_KEY is set", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    const { isEmailConfigured } = await import("@/lib/email");
    expect(isEmailConfigured()).toBe(true);
  });

  it("sendConfirmationEmail returns null when not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { sendConfirmationEmail } = await import("@/lib/email");
    const result = await sendConfirmationEmail({
      to: "test@test.com",
      participantName: "Test User",
      eventName: "Test Event",
      eventDate: "1 — 3 Janvier 2026",
      eventLieu: "Abidjan · Côte d'Ivoire",
      reference: "AIKO-ABC123",
      ticketNumber: 1,
      type: "badge",
    });
    expect(result).toBeNull();
  });

  it("sendReminderEmail returns null when not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { sendReminderEmail } = await import("@/lib/email");
    const result = await sendReminderEmail({
      to: "test@test.com",
      participantName: "Test User",
      eventName: "Test Event",
      eventDate: "1 — 3 Janvier 2026",
      eventLieu: "Abidjan · Côte d'Ivoire",
      reference: "AIKO-ABC123",
    });
    expect(result).toBeNull();
  });

  it("sendPasswordResetEmail returns null when not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { sendPasswordResetEmail } = await import("@/lib/email");
    const result = await sendPasswordResetEmail({
      to: "test@test.com",
      name: "Test",
      resetUrl: "https://aikoboard.com/admin/reset-password?token=abc",
    });
    expect(result).toBeNull();
  });

  it("sendWelcomeEmail returns null when not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { sendWelcomeEmail } = await import("@/lib/email");
    const result = await sendWelcomeEmail({
      to: "new@test.com",
      name: "Nouveau",
      role: "CONCIERGE",
      loginUrl: "https://aikoboard.com/login",
    });
    expect(result).toBeNull();
  });

  it("sendAdminNotificationEmail returns null when not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { sendAdminNotificationEmail } = await import("@/lib/email");
    const result = await sendAdminNotificationEmail({
      type: "new_registration",
      eventName: "Test Event",
      participantName: "Test User",
      reference: "AIKO-XYZ",
      amount: 5000,
    });
    expect(result).toBeNull();
  });
});
