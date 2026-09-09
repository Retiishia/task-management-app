/**
 * In-Memory Sliding Window Rate Limiter
 * Suitable for Next.js serverless and Node.js environments.
 */

const tracker = new Map();

// Periodic cleanup every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of tracker.entries()) {
      if (now > record.resetTime) {
        tracker.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Check if an identifier (IP address, email, or key) is within rate limits.
 * @param {string} identifier - Unique key to track (e.g. IP address, action:email)
 * @param {number} maxRequests - Maximum allowed requests within window
 * @param {number} windowMs - Time window in milliseconds (default 15 minutes)
 * @returns {{ allowed: boolean, remaining: number, resetTime: number, retryAfterSec: number }}
 */
export function rateLimit(identifier, maxRequests = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = tracker.get(identifier);

  if (!record || now > record.resetTime) {
    tracker.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
      retryAfterSec: 0,
    };
  }

  if (record.count >= maxRequests) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfterSec: Math.max(1, retryAfterSec),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
    retryAfterSec: 0,
  };
}

/**
 * Extracts a client IP from Next.js request headers
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
