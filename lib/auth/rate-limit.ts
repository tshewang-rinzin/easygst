/**
 * In-memory rate limiter for auth endpoints.
 * For multi-instance deployments, replace with Redis-backed implementation.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

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

/**
 * Check if a request is rate limited.
 * @param key - Unique identifier (e.g., IP address, email)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // First request or window expired
    store.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      retryAfterSeconds: 0,
    };
  }

  if (entry.count >= config.maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    retryAfterSeconds: 0,
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
 * Falls back to 'unknown' if no IP can be determined.
 */
export function getRateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}
