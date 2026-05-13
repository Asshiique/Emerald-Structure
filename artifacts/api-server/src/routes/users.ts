import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth, requireRoles, requireSelfOrRoles } from "../middleware/auth";
import { z } from "zod";

const router: IRouter = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const VALID_ROLES = ["admin", "teacher", "parent", "student"] as const;

const createUserSchema = z.object({
  id: z.string().min(1, "id (Firebase UID) is required"),
  email: z.string().email("valid email required"),
  name: z.string().min(1, "name is required"),
  role: z.enum([...VALID_ROLES], {
    invalid_type_error: "role must be one of: admin, teacher, parent, student",
  }),
  classSection: z.string().optional(),
  rollNo: z.string().optional(),
  parentName: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  hasSeenWelcome: z.boolean().optional(),
});

const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    name: z.string().min(1).optional(),
    role: z.enum([...VALID_ROLES]).optional(),
    classSection: z.string().optional(),
    rollNo: z.string().optional(),
    parentName: z.string().optional(),
    phone: z.string().optional(),
    department: z.string().optional(),
    hasSeenWelcome: z.boolean().optional(),
  })
  .refine(
    (d) => Object.entries(d).some(([, v]) => v !== undefined),
    { message: "At least one field must have a value" }
  );

// ─── GET /api/users ──────────────────────────────────────────────────────────
router.get("/users", requireAuth, requireRoles(["admin"]), async (_req, res, next) => {
  try {
    const rows = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/users/:id ──────────────────────────────────────────────────────
router.get(
  "/users/:id",
  requireAuth,
  requireSelfOrRoles((req) => {
    const id = req.params.id;
    return Array.isArray(id) ? id[0] : id;
  }, ["admin"]),
  async (req, res, next) => {
    try {
      const [row] = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id)).limit(1);
      if (!row) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(row);
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/users ─────────────────────────────────────────────────────────
router.post("/users", requireAuth, requireRoles(["admin"]), async (req, res, next) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        message: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
      return;
    }
    const [created] = await db.insert(usersTable).values(parsed.data).returning();
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/users/:id ────────────────────────────────────────────────────
router.patch(
  "/users/:id",
  requireAuth,
  requireSelfOrRoles((req) => {
    const id = req.params.id;
    return Array.isArray(id) ? id[0] : id;
  }, ["admin"]),
  async (req, res, next) => {
    try {
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({
          message: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        });
        return;
      }

      const updates = parsed.data;
      // Only admins may promote/demote roles
      if (updates.role && req.auth?.role !== "admin") {
        res.status(403).json({ message: "Only admin can change role" });
        return;
      }

      const [updated] = await db
        .update(usersTable)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(usersTable.id, req.params.id))
        .returning();

      if (!updated) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
