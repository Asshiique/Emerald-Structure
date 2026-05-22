import { pgTable, text, timestamp, jsonb, boolean, integer, pgEnum, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  classSection: text("class_section"),
  rollNo: text("roll_no"),
  parentName: text("parent_name"),
  phone: text("phone"),
  department: text("department"),
  hasSeenWelcome: boolean("has_seen_welcome").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  roleIdx: index("users_role_idx").on(t.role),
}));

export const noticesTable = pgTable("notices", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull(),
  targetRole: text("target_role").notNull().default("all"),
  postedAt: timestamp("posted_at", { withTimezone: true }).defaultNow().notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  postedAtIdx: index("notices_posted_at_idx").on(t.postedAt),
  targetRoleIdx: index("notices_target_role_idx").on(t.targetRole),
}));

export const attendanceTable = pgTable("attendance", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  classSection: text("class_section").notNull(),
  teacherId: text("teacher_id").notNull(),
  records: jsonb("records").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  // Compound index: attendance is always queried by both classSection and date together
  classSectionDateIdx: index("attendance_class_section_date_idx").on(t.classSection, t.date),
}));

export const feesTable = pgTable("fees", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  amount: integer("amount").notNull(),
  term: text("term").notNull(),
  status: text("status").notNull(),
  dueDate: text("due_date").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  studentIdIdx: index("fees_student_id_idx").on(t.studentId),
}));

export const insertUserSchema = createInsertSchema(usersTable);
export const insertNoticeSchema = createInsertSchema(noticesTable);
export const insertAttendanceSchema = createInsertSchema(attendanceTable);
export const insertFeeSchema = createInsertSchema(feesTable);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertFee = z.infer<typeof insertFeeSchema>;

export type UserRow = typeof usersTable.$inferSelect;
export type NoticeRow = typeof noticesTable.$inferSelect;
export type AttendanceRow = typeof attendanceTable.$inferSelect;
export type FeeRow = typeof feesTable.$inferSelect;

// ─── Student of the Month ─────────────────────────────────────────────────────

export const pointCategoryEnum = pgEnum("point_category", [
  "curricular",
  "non_curricular",
  "discipline",
  "homework",
  "behaviour",
]);

export const pointLogTable = pgTable("point_log", {
  id: text("id").primaryKey(),
  /** Firestore student document ID */
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  /** Firebase UID of the awarding teacher */
  teacherId: text("teacher_id").notNull(),
  teacherName: text("teacher_name").notNull(),
  /** Class section string e.g. "X-A" — consistent with rest of schema */
  classSection: text("class_section").notNull(),
  category: pointCategoryEnum("category").notNull(),
  points: integer("points").notNull(),
  note: text("note"),
  awardedAt: timestamp("awarded_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  studentIdIdx: index("point_log_student_id_idx").on(t.studentId),
  teacherIdIdx: index("point_log_teacher_id_idx").on(t.teacherId),
  // Compound: leaderboard queries always filter by classSection + awardedAt range
  classSectionAwardedAtIdx: index("point_log_class_section_awarded_at_idx").on(t.classSection, t.awardedAt),
}));

export const monthlyWinnerTable = pgTable(
  "monthly_winner",
  {
    id: text("id").primaryKey(),
    classSection: text("class_section").notNull(),
    studentId: text("student_id").notNull(),
    studentName: text("student_name").notNull(),
    /** 1–12 */
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    /** Firebase UID of admin who closed the month */
    closedBy: text("closed_by").notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueClassMonth: unique("monthly_winner_class_month_year").on(
      t.classSection,
      t.month,
      t.year
    ),
    // Index to quickly fetch all winners for a class (hall of fame)
    classSectionIdx: index("monthly_winner_class_section_idx").on(t.classSection),
  })
);

export const repeatWinnerGuardTable = pgTable(
  "repeat_winner_guard",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull(),
    classSection: text("class_section").notNull(),
    lastWonMonth: integer("last_won_month").notNull(),
    lastWonYear: integer("last_won_year").notNull(),
  },
  (t) => ({
    uniqueStudentClass: unique("repeat_winner_guard_student_class").on(
      t.studentId,
      t.classSection
    ),
  })
);

export const insertPointLogSchema = createInsertSchema(pointLogTable);
export const insertMonthlyWinnerSchema = createInsertSchema(monthlyWinnerTable);
export const insertRepeatWinnerGuardSchema = createInsertSchema(repeatWinnerGuardTable);

export type PointLogRow = typeof pointLogTable.$inferSelect;
export type MonthlyWinnerRow = typeof monthlyWinnerTable.$inferSelect;
export type RepeatWinnerGuardRow = typeof repeatWinnerGuardTable.$inferSelect;