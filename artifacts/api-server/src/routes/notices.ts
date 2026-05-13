import { Router, type IRouter } from "express";
import { db, noticesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth, requireRoles } from "../middleware/auth";
import { z } from "zod";

const router: IRouter = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────
// These mirror the OpenAPI spec shapes and are used until orval-generated
// @workspace/api-zod schemas are referenced directly.

const createNoticeBodySchema = z.object({
  title: z.string().min(1, "title is required"),
  body: z.string().min(1, "body is required"),
  category: z.string().min(1, "category is required"),
  targetRole: z.string().default("all"),
  postedAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .transform((v) => (v ? new Date(v) : new Date())),
});

const updateNoticeBodySchema = z
  .object({
    title: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    targetRole: z.string().optional(),
    isRead: z.boolean().optional(),
    postedAt: z
      .string()
      .datetime({ offset: true })
      .optional()
      .transform((v) => (v ? new Date(v) : undefined)),
  })
  .refine(
    (d) => Object.entries(d).some(([, v]) => v !== undefined),
    { message: "At least one field must have a value" }
  );

// ─── GET /api/notices ─────────────────────────────────────────────────────────
router.get("/notices", requireAuth, async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(noticesTable)
      .orderBy(desc(noticesTable.postedAt));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/notices ────────────────────────────────────────────────────────
router.post(
  "/notices",
  requireAuth,
  requireRoles(["admin", "teacher"]),
  async (req, res, next) => {
    try {
      const parsed = createNoticeBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({
          message: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        });
        return;
      }

      const { title, body, category, targetRole, postedAt } = parsed.data;
      const [created] = await db
        .insert(noticesTable)
        .values({
          id: crypto.randomUUID(),
          title,
          body,
          category,
          targetRole,
          postedAt,
          isRead: false,
        })
        .returning();

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/notices/:id ───────────────────────────────────────────────────
router.patch(
  "/notices/:id",
  requireAuth,
  requireRoles(["admin", "teacher"]),
  async (req, res, next) => {
    try {
      const parsed = updateNoticeBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({
          message: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        });
        return;
      }

      const updates = parsed.data;
      const [updated] = await db
        .update(noticesTable)
        .set(updates as Partial<typeof noticesTable.$inferInsert>)
        .where(eq(noticesTable.id, req.params.id))
        .returning();

      if (!updated) {
        res.status(404).json({ message: "Notice not found" });
        return;
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/notices/:id ──────────────────────────────────────────────────
router.delete(
  "/notices/:id",
  requireAuth,
  requireRoles(["admin"]),
  async (req, res, next) => {
    try {
      const [deleted] = await db
        .delete(noticesTable)
        .where(eq(noticesTable.id, req.params.id))
        .returning({ id: noticesTable.id });

      if (!deleted) {
        res.status(404).json({ message: "Notice not found" });
        return;
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
