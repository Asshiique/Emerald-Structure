import { Router, type IRouter } from "express";
import { db, attendanceTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth, requireRoles } from "../middleware/auth";
import { z } from "zod";

const router: IRouter = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const attendanceRecordItemSchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().min(1),
  status: z.enum(["present", "absent", "late"]),
});

const createAttendanceSchema = z.object({
  id: z.string().min(1, "id is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  classSection: z.string().min(1, "classSection is required"),
  teacherId: z.string().min(1, "teacherId is required"),
  records: z.array(attendanceRecordItemSchema).min(1, "records must not be empty"),
});

const updateAttendanceSchema = z
  .object({
    records: z.array(attendanceRecordItemSchema).optional(),
    teacherId: z.string().min(1).optional(),
  })
  .refine(
    (d) => Object.entries(d).some(([, v]) => v !== undefined),
    { message: "At least one field must have a value" }
  );

// ─── GET /api/attendance ─────────────────────────────────────────────────────
router.get("/attendance", requireAuth, requireRoles(["admin", "teacher"]), async (_req, res, next) => {
  try {
    const rows = await db.select().from(attendanceTable).orderBy(desc(attendanceTable.createdAt));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/attendance ────────────────────────────────────────────────────
router.post("/attendance", requireAuth, requireRoles(["admin", "teacher"]), async (req, res, next) => {
  try {
    const parsed = createAttendanceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        message: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
      return;
    }
    const [created] = await db.insert(attendanceTable).values(parsed.data).returning();
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/attendance/:id ───────────────────────────────────────────────
router.patch("/attendance/:id", requireAuth, requireRoles(["admin", "teacher"]), async (req, res, next) => {
  try {
    const parsed = updateAttendanceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        message: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
      return;
    }
    const [updated] = await db
      .update(attendanceTable)
      .set(parsed.data)
      .where(eq(attendanceTable.id, req.params.id))
      .returning();
    if (!updated) {
      res.status(404).json({ message: "Attendance record not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
