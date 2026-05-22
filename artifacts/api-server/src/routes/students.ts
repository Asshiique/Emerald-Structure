import { Router, type IRouter } from "express";
import { db, pointLogTable, feesTable, repeatWinnerGuardTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRoles } from "../middleware/auth";
import { getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const router: IRouter = Router();

function adminFirestore() {
  // Firebase Admin app is already initialised by auth.ts
  return getFirestore(getApps()[0]);
}

// ─── DELETE /api/students/:id ─────────────────────────────────────────────────
// Admin only. Cascade-deletes a student across both databases:
//   Postgres : point_log, repeat_winner_guard, fees (by studentId)
//   Firestore: students/{id}  and  fees/{id}  (in a single batch)
//
// WHY NOT client-side? The Firestore security rules block direct deletion of
// student documents from the client. The client calls this endpoint instead,
// which runs in a trusted server context (Firebase Admin SDK bypasses rules).

router.delete(
  "/students/:id",
  requireAuth,
  requireRoles(["admin"]),
  async (req, res, next) => {
    try {
      const studentId = String(req.params.id);

      // ── Step 1: Clean up PostgreSQL records ───────────────────────────────
      // Order matters: delete dependent records before any potential constraint issues.
      // If any of these fail the Firestore docs are untouched — no split state.
      await db.delete(pointLogTable).where(eq(pointLogTable.studentId, studentId));
      await db.delete(repeatWinnerGuardTable).where(eq(repeatWinnerGuardTable.studentId, studentId));
      await db.delete(feesTable).where(eq(feesTable.studentId, studentId));

      // ── Step 2: Clean up Firestore records (atomic batch) ─────────────────
      const fsDb = adminFirestore();
      const batch = fsDb.batch();
      batch.delete(fsDb.doc(`students/${studentId}`));
      // The Firestore fees collection document is keyed by studentId
      batch.delete(fsDb.doc(`fees/${studentId}`));
      await batch.commit();

      res.status(200).json({ deleted: studentId });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
