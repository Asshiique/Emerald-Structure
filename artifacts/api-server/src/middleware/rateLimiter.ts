/**
 * Rate limiting middleware for Emerald School API.
 *
 * Three tiers:
 *  - apiLimiter       — general protection: 100 req/min per IP on all routes
 *  - writeLimiter     — tighter limit: 20 req/min per IP for POST/PATCH/DELETE
 *  - strictLimiter    — brute-force guard: 10 req/15 min per IP for auth routes
 *
 * Uses in-memory storage (express-rate-limit default). Sufficient for a
 * single-server school deployment. Upgrade to Redis store (ioredis +
 * rate-limit-redis) when you add a second server replica.
 */

import { rateLimit } from "express-rate-limit";

const isProd = process.env["NODE_ENV"] === "production";

/** Shared response when limit is exceeded */
const limitReachedHandler = (_req: any, res: any) => {
  res.status(429).json({
    message: "Too many requests — please slow down and try again shortly.",
  });
};

/**
 * General API limit: 100 requests per minute per IP.
 * Applied to ALL /api/* routes.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,           // 1 minute
  max: isProd ? 100 : 500,       // relax in dev
  standardHeaders: "draft-8",   // Return RateLimit headers
  legacyHeaders: false,
  handler: limitReachedHandler,
});

/**
 * Write operation limit: 20 requests per minute per IP.
 * Applied to POST, PATCH, DELETE routes — prevents bulk data spam.
 */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProd ? 20 : 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: limitReachedHandler,
});

/**
 * Strict auth limit: 10 requests per 15 minutes per IP.
 * Applied to login / token-verify routes — blocks brute force attacks.
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: isProd ? 10 : 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,  // Only count failed attempts toward the limit
  handler: limitReachedHandler,
});
