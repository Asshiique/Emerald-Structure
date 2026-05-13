import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createRequire } from "module";
import router from "./routes";
import { logger } from "./lib/logger";
import { apiLimiter, writeLimiter, strictLimiter } from "./middleware/rateLimiter";

const require = createRequire(import.meta.url);
const path = require("path") as typeof import("path");


const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static public files (privacy policy, terms, etc.) ─────────────────────
app.use(express.static(path.join(path.dirname(new URL(import.meta.url).pathname), "..", "public")));

// ── Rate limiting ──────────────────────────────────────────────────────────
// General limit: 100 req/min per IP on all API routes
app.use("/api", apiLimiter);

// Stricter limit for write operations: 20 req/min per IP
app.use("/api", (req, res, next) => {
  if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  return next();
});

// Brute-force guard on auth: 10 attempts/15 min per IP
app.use("/api/healthz", strictLimiter);

app.use("/api", router);

export default app;
