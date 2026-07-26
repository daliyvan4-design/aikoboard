import { describe, it, expect, vi, beforeEach } from "vitest";

describe("rate-limit utility", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns null (no blocking) when Redis is not configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { rateLimit } = await import("@/lib/rate-limit");
    const mockReq = {
      headers: new Headers({ "x-forwarded-for": "127.0.0.1" }),
    } as any;
    const result = await rateLimit(mockReq, "test", 5, "60 s");
    expect(result).toBeNull();
  });

  it("returns null when only URL is set but no token", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { rateLimit } = await import("@/lib/rate-limit");
    const mockReq = {
      headers: new Headers({}),
    } as any;
    const result = await rateLimit(mockReq, "test2", 10, "60 s");
    expect(result).toBeNull();
  });
});
