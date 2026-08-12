import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { NextRequest, NextResponse } from "next/server";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

const limiters: Record<string, Ratelimit> = {};

function getLimiter(name: string, requests: number, window: string): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const key = `${name}:${requests}:${window}`;
  if (!limiters[key]) {
    limiters[key] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window as `${number} ${"s" | "m" | "h" | "d"}`),
      prefix: `aiko:rl:${name}`,
    });
  }
  return limiters[key];
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

function parseWindowMs(window: string): number {
  const match = window.match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match) return 60_000;
  const n = parseInt(match[1]);
  const unit = match[2];
  if (unit === "s") return n * 1000;
  if (unit === "m") return n * 60_000;
  if (unit === "h") return n * 3_600_000;
  return n * 86_400_000;
}

function memoryRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;

  entry.count++;
  return true;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous"
  );
}

export async function rateLimit(
  req: NextRequest,
  name: string,
  requests: number = 10,
  window: string = "60 s",
  /**
   * Identifiant du quota. Par défaut l'IP ; pour une route authentifiée on
   * passe l'identifiant du compte, plus juste derrière un NAT partagé.
   */
  identifier?: string,
): Promise<NextResponse | null> {
  const ip = identifier || getClientIp(req);
  const limiter = getLimiter(name, requests, window);

  if (limiter) {
    try {
      const { success, remaining, reset } = await limiter.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "Trop de requetes. Reessayez dans quelques instants." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Remaining": String(remaining),
              "X-RateLimit-Reset": String(reset),
            },
          },
        );
      }
      return null;
    } catch {
      // Redis unavailable — fall through to in-memory limiter
    }
  }

  const windowMs = parseWindowMs(window);
  const allowed = memoryRateLimit(`${name}:${ip}`, requests, windowMs);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de requetes. Reessayez dans quelques instants." },
      { status: 429 },
    );
  }

  return null;
}
