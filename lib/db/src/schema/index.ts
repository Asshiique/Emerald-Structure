import { pgTable, text, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
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
});

export const noticesTable = pgTable("notices", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull(),
  targetRole: text("target_role").notNull().default("all"),
  postedAt: timestamp("posted_at", { withTimezone: true }).defaultNow().notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attendanceTable = pgTable("attendance", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  classSection: text("class_section").notNull(),
  teacherId: text("teacher_id").notNull(),
  records: jsonb("records").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const feesTable = pgTable("fees", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  amount: integer("amount").notNull(),
  term: text("term").notNull(),
  status: text("status").notNull(),
  dueDate: text("due_date").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

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