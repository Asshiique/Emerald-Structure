import { Router, type IRouter } from "express";
import { db, feesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth, requireRoles } from "../middleware/auth";
import { z } from "zod";

const router: IRouter = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const FEE_STATUS = ["pending", "paid", "overdue", "waived"] as const;

const createFeeSchema = z.object({
  id: z.string().min(1, "id is required"),
  studentId: z.string().min(1, "studentId is required"),
  amount: z.number().int().positive("amount must be a positive integer"),
  term: z.string().min(1, "term is required (e.g. 'Term 1 2025')"),
  status: z.enum([...FEE_STATUS], {
    invalid_type_error: "status must be one of: pending, paid, overdue, waived",
  }),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD"),
  paidAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

const updateFeeSchema = z
  .object({
    amount: z.number().int().positive().optional(),
    term: z.string().min(1).optional(),
    status: z.enum([...FEE_STATUS]).optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    paidAt: z
      .string()
      .datetime({ offset: true })
      .optional()
      .transform((v) => (v ? new Date(v) : undefined)),
  })
  .refine(
    (d) => Object.entries(d).some(([, v]) => v !== undefined),
    { message: "At least one field must have a value" }
  );

// ─── GET /api/fees ───────────────────────────────────────────────────────────
router.get("/fees", requireAuth, requireRoles(["admin"]), async (_req, res, next) => {
  try {
    const rows = await db.select().from(feesTable).orderBy(desc(feesTable.createdAt));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/fees ──────────────────────────────────────────────────────────
router.post("/fees", requireAuth, requireRoles(["admin"]), async (req, res, next) => {
  try {
    const parsed = createFeeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        message: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
      return;
    }
    const [created] = await db.insert(feesTable).values(parsed.data).returning();
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/fees/:id ─────────────────────────────────────────────────────
router.patch("/fees/:id", requireAuth, requireRoles(["admin"]), async (req, res, next) => {
  try {
    const parsed = updateFeeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        message: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
      return;
    }
    const [updated] = await db
      .update(feesTable)
      .set(parsed.data)
      .where(eq(feesTable.id, req.params.id))
      .returning();
    if (!updated) {
      res.status(404).json({ message: "Fee record not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
