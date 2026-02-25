/**
 * Rate limiter using Upstash Redis (works across Vercel instances).
 * Falls back to in-memory if Redis is not configured (dev convenience).
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── Types (unchanged API) ───────────────────────────────────────

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxAttempts: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

// ─── Redis client (lazy, singleton) ──────────────────────────────

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

// ─── Upstash rate limiters cache ─────────────────────────────────

const limiters = new Map<string, Ratelimit>();

function getLimiter(config: RateLimitConfig): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  const cacheKey = `${config.maxAttempts}:${config.windowSeconds}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(
        config.maxAttempts,
        `${config.windowSeconds} s`
      ),
      prefix: 'rl',
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

// ─── In-memory fallback (dev only) ──────────────────────────────

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (entry.resetAt < now) memoryStore.delete(key);
    }
  }, 5 * 60 * 1000);
}

function checkMemoryRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return { allowed: true, remaining: config.maxAttempts - 1, retryAfterSeconds: 0 };
  }

  if (entry.count >= config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxAttempts - entry.count, retryAfterSeconds: 0 };
}

// ─── Public API (same signature as before) ───────────────────────

/**
 * Check if a request is rate limited.
 * Uses Upstash Redis if configured, falls back to in-memory.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const limiter = getLimiter(config);

  if (!limiter) {
    // No Redis — fall back to in-memory (logs once)
    if (process.env.NODE_ENV === 'production') {
      console.warn('[rate-limit] UPSTASH_REDIS_REST_URL not set — using in-memory fallback (not safe for multi-instance)');
    }
    return checkMemoryRateLimit(key, config);
  }

  const result = await limiter.limit(key);
  return {
    allowed: result.success,
    remaining: result.remaining,
    retryAfterSeconds: result.success ? 0 : Math.ceil((result.reset - Date.now()) / 1000),
  };
}

// Preset configurations
export const RATE_LIMITS = {
  signIn: { maxAttempts: 5, windowSeconds: 60 },
  signUp: { maxAttempts: 3, windowSeconds: 60 },
  forgotPassword: { maxAttempts: 3, windowSeconds: 60 },
  resetPassword: { maxAttempts: 5, windowSeconds: 60 },
  verifyEmail: { maxAttempts: 5, windowSeconds: 60 },
  resendVerification: { maxAttempts: 3, windowSeconds: 300 },
} as const;

/**
 * Get a rate limit key from request headers (IP-based).
 */
export function getRateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}
