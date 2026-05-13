import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { NextFunction, Request, Response } from "express";

type Role = "admin" | "teacher" | "parent" | "student";

// ─── Firebase Admin initialisation ───────────────────────────────────────────
// Priority:
//  1. FIREBASE_SERVICE_ACCOUNT env var — full service-account JSON as a string.
//     Ideal for Replit/container deployments where file paths are inconvenient.
//  2. GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service-account JSON file.
//     applicationDefault() picks this up automatically.
//  3. applicationDefault() fallback — works on GCE/Cloud Run/dev with `gcloud auth`.
//
// In production (NODE_ENV=production), options 1 or 2 must be set or the
// server will throw at startup rather than silently failing at token verify time.

if (getApps().length === 0) {
  const inlineJson = process.env["FIREBASE_SERVICE_ACCOUNT"];

  if (inlineJson) {
    // Option 1: inline JSON in env var
    let serviceAccount: object;
    try {
      serviceAccount = JSON.parse(inlineJson) as object;
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT env var is set but contains invalid JSON. " +
          "It must be the full contents of your Firebase service-account JSON file."
      );
    }
    initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
  } else {
    // Option 2 & 3: applicationDefault() — works when GOOGLE_APPLICATION_CREDENTIALS
    // is set, or on GCE/Cloud Run, or when `gcloud auth application-default login` was run.
    const isProduction = process.env["NODE_ENV"] === "production";
    const hasCredFile = Boolean(process.env["GOOGLE_APPLICATION_CREDENTIALS"]);

    if (isProduction && !hasCredFile) {
      throw new Error(
        "Firebase Admin SDK requires credentials in production.\n" +
          "Set either:\n" +
          "  • FIREBASE_SERVICE_ACCOUNT — full JSON of the service-account key file, OR\n" +
          "  • GOOGLE_APPLICATION_CREDENTIALS — path to the service-account JSON file"
      );
    }

    // Will throw a descriptive error at first use if no credentials are found
    initializeApp({ credential: applicationDefault() });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim();
}

async function getRoleFromDb(uid: string): Promise<string | undefined> {
  const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, uid))
    .limit(1);
  return user?.role;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ message: "Missing bearer token" });
      return;
    }

    const decoded = await getAuth().verifyIdToken(token, true);
    const role = (decoded.role as string | undefined) ?? (await getRoleFromDb(decoded.uid));
    req.auth = {
      uid: decoded.uid,
      email: decoded.email,
      role,
    };
    return next();
  } catch (err) {
    res.status(401).json({ message: "Invalid auth token" });
  }
}

export function requireRoles(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.auth?.role as Role | undefined;
    if (!role) {
      res.status(403).json({ message: "Missing role claim" });
      return;
    }
    if (!roles.includes(role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    return next();
  };
}

export function requireSelfOrRoles(getTargetUid: (req: Request) => string | undefined, roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const uid = req.auth?.uid;
    const role = req.auth?.role as Role | undefined;
    const targetUid = getTargetUid(req);

    if (!uid || !targetUid) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    if (uid === targetUid) return next();
    if (role && roles.includes(role)) return next();
    res.status(403).json({ message: "Forbidden" });
  };
}
