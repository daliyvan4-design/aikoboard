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
): Promise<NextResponse | null> {
  const limiter = getLimiter(name, requests, window);
  if (!limiter) return null;

  const ip = getClientIp(req);

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
  } catch {
    // Redis unavailable — allow request through
  }

  return null;
}
