import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, getRateLimitKey } from './rate-limit';

describe('checkRateLimit', () => {
  const config = { maxAttempts: 3, windowSeconds: 60 };

  it('allows first request', () => {
    const key = `test-${Date.now()}-first`;
    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('allows requests up to max attempts', () => {
    const key = `test-${Date.now()}-max`;
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('blocks requests after max attempts', () => {
    const key = `test-${Date.now()}-block`;
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('uses separate windows for different keys', () => {
    const key1 = `test-${Date.now()}-sep1`;
    const key2 = `test-${Date.now()}-sep2`;

    checkRateLimit(key1, config);
    checkRateLimit(key1, config);
    checkRateLimit(key1, config);

    const result1 = checkRateLimit(key1, config);
    const result2 = checkRateLimit(key2, config);

    expect(result1.allowed).toBe(false);
    expect(result2.allowed).toBe(true);
  });
});

describe('getRateLimitKey', () => {
  it('creates formatted key', () => {
    expect(getRateLimitKey('signIn', 'test@example.com')).toBe('signIn:test@example.com');
  });
});
