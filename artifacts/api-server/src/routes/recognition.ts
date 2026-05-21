import { Router, type IRouter } from "express";
import {
  db,
  pointLogTable,
  monthlyWinnerTable,
  repeatWinnerGuardTable,
} from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireAuth, requireRoles } from "../middleware/auth";
import { z } from "zod";
import { getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const router: IRouter = Router();

// ─── Firebase Admin Firestore (reuses already-initialised app from auth.ts) ──
function adminFirestore() {
  // getApps() is non-empty because auth.ts already called initializeApp().
  return getFirestore(getApps()[0]);
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const VALID_CATEGORIES = [
  "curricular",
  "non_curricular",
  "discipline",
  "homework",
  "behaviour",
] as const;

const awardPointsSchema = z.object({
  studentId: z.string().min(1, "studentId is required"),
  studentName: z.string().min(1, "studentName is required"),
  classSection: z.string().min(1, "classSection is required"),
  category: z.enum(VALID_CATEGORIES, {
    invalid_type_error: `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
  }),
  points: z
    .number()
    .int("points must be an integer")
    .min(1, "points must be at least 1")
    .max(10, "points must be at most 10"),
  note: z.string().optional(),
});

// ─── POST /api/points/award ───────────────────────────────────────────────────
// Teacher only. Permissive: teacher can award to any classSection.

router.post(
  "/points/award",
  requireAuth,
  requireRoles(["teacher", "admin"]),
  async (req, res, next) => {
    try {
      const parsed = awardPointsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({
          message: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        });
        return;
      }

      const { studentId, studentName, classSection, category, points, note } =
        parsed.data;

      const teacherId = req.auth!.uid;
      const teacherName = req.auth!.email ?? teacherId;

      const [log] = await db
        .insert(pointLogTable)
        .values({
          id: crypto.randomUUID(),
          studentId,
          studentName,
          teacherId,
          teacherName,
          classSection,
          category,
          points,
          note: note ?? null,
        })
        .returning();

      res.status(201).json(log);
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/points/leaderboard/:classSection/:month/:year ──────────────────
// Admin only. Returns students ranked by total points, with per-category breakdown.

router.get(
  "/points/leaderboard/:classSection/:month/:year",
  requireAuth,
  requireRoles(["admin"]),
  async (req, res, next) => {
    try {
      const classSection = String(req.params.classSection);
      const month = String(req.params.month);
      const year = String(req.params.year);
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);

      if (isNaN(m) || m < 1 || m > 12) {
        res.status(422).json({ message: "month must be 1–12" });
        return;
      }
      if (isNaN(y) || y < 2020 || y > 2100) {
        res.status(422).json({ message: "year must be between 2020–2100" });
        return;
      }

      // Fetch all logs for this classSection + month + year
      const logs = await db
        .select()
        .from(pointLogTable)
        .where(
          and(
            eq(pointLogTable.classSection, classSection),
            // Filter by month and year using date truncation
            sql`EXTRACT(MONTH FROM ${pointLogTable.awardedAt}) = ${m}`,
            sql`EXTRACT(YEAR FROM ${pointLogTable.awardedAt}) = ${y}`
          )
        )
        .orderBy(desc(pointLogTable.awardedAt));

      // Aggregate by student
      const studentMap = new Map<
        string,
        {
          studentId: string;
          studentName: string;
          totalPoints: number;
          breakdown: Record<string, number>;
          awards: typeof logs;
        }
      >();

      for (const log of logs) {
        const existing = studentMap.get(log.studentId);
        if (existing) {
          existing.totalPoints += log.points;
          existing.breakdown[log.category] =
            (existing.breakdown[log.category] ?? 0) + log.points;
          existing.awards.push(log);
        } else {
          studentMap.set(log.studentId, {
            studentId: log.studentId,
            studentName: log.studentName,
            totalPoints: log.points,
            breakdown: { [log.category]: log.points },
            awards: [log],
          });
        }
      }

      const ranked = [...studentMap.values()].sort(
        (a, b) => b.totalPoints - a.totalPoints
      );

      // Check if this classSection+month is already closed
      const [existing] = await db
        .select()
        .from(monthlyWinnerTable)
        .where(
          and(
            eq(monthlyWinnerTable.classSection, classSection),
            eq(monthlyWinnerTable.month, m),
            eq(monthlyWinnerTable.year, y)
          )
        )
        .limit(1);

      // Repeat winner check for the top student
      let isRepeatWinner = false;
      if (ranked.length > 0) {
        const [guard] = await db
          .select()
          .from(repeatWinnerGuardTable)
          .where(
            and(
              eq(repeatWinnerGuardTable.studentId, ranked[0].studentId),
              eq(repeatWinnerGuardTable.classSection, classSection)
            )
          )
          .limit(1);

        if (guard) {
          // Consecutive month check
          const prevMonth = m === 1 ? 12 : m - 1;
          const prevYear = m === 1 ? y - 1 : y;
          isRepeatWinner =
            guard.lastWonMonth === prevMonth && guard.lastWonYear === prevYear;
        }
      }

      res.json({
        classSection,
        month: m,
        year: y,
        isClosed: !!existing,
        closedWinner: existing
          ? { studentId: existing.studentId, studentName: existing.studentName }
          : null,
        isRepeatWinner,
        leaderboard: ranked,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/months/close/:classSection/:month/:year ───────────────────────
// Admin only. Determines winner, checks repeat guard, inserts winner,
// writes Firestore notification to all parents of that class.

router.post(
  "/months/close/:classSection/:month/:year",
  requireAuth,
  requireRoles(["admin"]),
  async (req, res, next) => {
    try {
      const classSection = String(req.params.classSection);
      const month = String(req.params.month);
      const year = String(req.params.year);
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);

      if (isNaN(m) || m < 1 || m > 12) {
        res.status(422).json({ message: "month must be 1–12" });
        return;
      }
      if (isNaN(y) || y < 2020 || y > 2100) {
        res.status(422).json({ message: "year must be between 2020–2100" });
        return;
      }

      // Check already closed
      const [alreadyClosed] = await db
        .select()
        .from(monthlyWinnerTable)
        .where(
          and(
            eq(monthlyWinnerTable.classSection, classSection),
            eq(monthlyWinnerTable.month, m),
            eq(monthlyWinnerTable.year, y)
          )
        )
        .limit(1);

      if (alreadyClosed) {
        res.status(409).json({
          message: "Month already closed for this class",
          winner: {
            studentId: alreadyClosed.studentId,
            studentName: alreadyClosed.studentName,
          },
        });
        return;
      }

      // Fetch all logs for this classSection + month + year
      const logs = await db
        .select()
        .from(pointLogTable)
        .where(
          and(
            eq(pointLogTable.classSection, classSection),
            sql`EXTRACT(MONTH FROM ${pointLogTable.awardedAt}) = ${m}`,
            sql`EXTRACT(YEAR FROM ${pointLogTable.awardedAt}) = ${y}`
          )
        );

      if (logs.length === 0) {
        res.status(422).json({
          message: "No point awards recorded for this class and month. Cannot close.",
        });
        return;
      }

      // Tally points per student
      const totals = new Map<string, { studentId: string; studentName: string; total: number }>();
      for (const log of logs) {
        const existing = totals.get(log.studentId);
        if (existing) {
          existing.total += log.points;
        } else {
          totals.set(log.studentId, {
            studentId: log.studentId,
            studentName: log.studentName,
            total: log.points,
          });
        }
      }

      // Find top student
      const ranked = [...totals.values()].sort((a, b) => b.total - a.total);
      const topStudent = ranked[0];

      // Check repeat winner guard
      const [guard] = await db
        .select()
        .from(repeatWinnerGuardTable)
        .where(
          and(
            eq(repeatWinnerGuardTable.studentId, topStudent.studentId),
            eq(repeatWinnerGuardTable.classSection, classSection)
          )
        )
        .limit(1);

      let isRepeatWinner = false;
      if (guard) {
        const prevMonth = m === 1 ? 12 : m - 1;
        const prevYear = m === 1 ? y - 1 : y;
        isRepeatWinner =
          guard.lastWonMonth === prevMonth && guard.lastWonYear === prevYear;
      }

      // Allow body override: if admin explicitly confirms repeat winner
      const { confirmRepeat } = (req.body ?? {}) as { confirmRepeat?: boolean };
      if (isRepeatWinner && !confirmRepeat) {
        res.status(422).json({
          message: "Top student won last month. Send confirmRepeat: true to override.",
          isRepeatWinner: true,
          topStudent: { studentId: topStudent.studentId, studentName: topStudent.studentName },
        });
        return;
      }

      // Insert winner
      const adminUid = req.auth!.uid;
      const [winner] = await db
        .insert(monthlyWinnerTable)
        .values({
          id: crypto.randomUUID(),
          classSection,
          studentId: topStudent.studentId,
          studentName: topStudent.studentName,
          month: m,
          year: y,
          closedBy: adminUid,
        })
        .returning();

      // Upsert repeat winner guard
      if (guard) {
        await db
          .update(repeatWinnerGuardTable)
          .set({ lastWonMonth: m, lastWonYear: y })
          .where(eq(repeatWinnerGuardTable.id, guard.id));
      } else {
        await db.insert(repeatWinnerGuardTable).values({
          id: crypto.randomUUID(),
          studentId: topStudent.studentId,
          classSection,
          lastWonMonth: m,
          lastWonYear: y,
        });
      }

      // ── Write Firestore notification ───────────────────────────────────────
      try {
        const firestoreDb = adminFirestore();
        const MONTH_NAMES = [
          "", "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December",
        ];
        await firestoreDb
          .collection("notifications")
          .doc(classSection)
          .collection("recognition")
          .doc(`${m}-${y}`)
          .set({
            type: "student_of_month",
            studentName: topStudent.studentName,
            className: classSection,
            month: m,
            year: y,
            monthName: MONTH_NAMES[m],
            announcedAt: new Date(),
          });
      } catch (firestoreErr) {
        // Firestore failure is non-fatal — winner is already stored in Postgres
        console.warn("[recognition] Firestore notification write failed:", firestoreErr);
      }

      res.status(201).json({
        winner: {
          studentId: winner.studentId,
          studentName: winner.studentName,
          classSection: winner.classSection,
          month: winner.month,
          year: winner.year,
        },
        isRepeatWinner,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/months/winner/:classSection/:month/:year ───────────────────────
// Parent, teacher, admin. Returns winner name + class only — NO points.

router.get(
  "/months/winner/:classSection/:month/:year",
  requireAuth,
  requireRoles(["parent", "teacher", "admin", "student"]),
  async (req, res, next) => {
    try {
      const classSection = String(req.params.classSection);
      const month = String(req.params.month);
      const year = String(req.params.year);
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);

      if (isNaN(m) || m < 1 || m > 12) {
        res.status(422).json({ message: "month must be 1–12" });
        return;
      }

      const [winner] = await db
        .select({
          studentId: monthlyWinnerTable.studentId,
          studentName: monthlyWinnerTable.studentName,
          classSection: monthlyWinnerTable.classSection,
          month: monthlyWinnerTable.month,
          year: monthlyWinnerTable.year,
        })
        .from(monthlyWinnerTable)
        .where(
          and(
            eq(monthlyWinnerTable.classSection, classSection),
            eq(monthlyWinnerTable.month, m),
            eq(monthlyWinnerTable.year, y)
          )
        )
        .limit(1);

      if (!winner) {
        res.status(404).json({ message: "Month not yet closed for this class" });
        return;
      }

      res.json(winner);
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/months/hall-of-fame/:classSection ───────────────────────────────
// Parent, teacher, admin. List of past winners — no points ever.

router.get(
  "/months/hall-of-fame/:classSection",
  requireAuth,
  requireRoles(["parent", "teacher", "admin", "student"]),
  async (req, res, next) => {
    try {
      const classSection = String(req.params.classSection);

      const winners = await db
        .select({
          studentId: monthlyWinnerTable.studentId,
          studentName: monthlyWinnerTable.studentName,
          classSection: monthlyWinnerTable.classSection,
          month: monthlyWinnerTable.month,
          year: monthlyWinnerTable.year,
        })
        .from(monthlyWinnerTable)
        .where(eq(monthlyWinnerTable.classSection, classSection))
        .orderBy(
          desc(monthlyWinnerTable.year),
          desc(monthlyWinnerTable.month)
        );

      res.json(winners);
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/points/recent (teacher's own recent awards, last 7 days) ────────
// Teacher only — used by the award-points screen to show recent activity.

router.get(
  "/points/recent",
  requireAuth,
  requireRoles(["teacher", "admin"]),
  async (req, res, next) => {
    try {
      const teacherId = req.auth!.uid;
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const logs = await db
        .select()
        .from(pointLogTable)
        .where(
          and(
            eq(pointLogTable.teacherId, teacherId),
            sql`${pointLogTable.awardedAt} >= ${since}`
          )
        )
        .orderBy(desc(pointLogTable.awardedAt))
        .limit(50);

      res.json(logs);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
