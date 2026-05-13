/**
 * Scheduled background jobs for Emerald International School.
 *
 * Jobs registered here:
 *  1. feeReminderJob       — runs every day at 8:00 AM IST
 *                            Finds students with pending fees and logs/notifies.
 *  2. attendanceSummaryJob — runs every weekday at 4:30 PM IST
 *                            Generates a per-class attendance summary for the day.
 *  3. keepAliveJob         — pings /api/healthz every 10 minutes to prevent
 *                            cold starts on free-tier hosting (Render, Railway, etc.)
 *
 * All times use cron syntax in UTC (IST = UTC+5:30).
 *   8:00 AM IST  = 02:30 UTC   → "30 2 * * *"
 *   4:30 PM IST  = 11:00 UTC   → "0 11 * * 1-5"  (Mon–Fri only)
 *
 * Extend this file to add email/SMS/FCM push integration once a
 * notification provider is configured (e.g. Firebase Cloud Messaging,
 * Twilio, or Resend for email).
 */

import cron from "node-cron";
import { db, feesTable, studentsTable } from "@workspace/db";
import { eq, and, lt } from "drizzle-orm";
import { logger } from "../lib/logger";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayIST(): string {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
}

function nowIST(): string {
  return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

// ─── Job 1: Daily Fee Reminder ────────────────────────────────────────────────

/**
 * Every day at 8:00 AM IST.
 * Finds all fee records that are overdue (dueDate < today, status = "pending").
 * Logs them — extend to send FCM/SMS/email per parent.
 */
async function runFeeReminder() {
  const today = todayIST();
  logger.info({ job: "feeReminder", today }, "Running daily fee reminder job");

  try {
    const overdueFees = await db
      .select({
        id: feesTable.id,
        studentId: feesTable.studentId,
        amount: feesTable.amount,
        dueDate: feesTable.dueDate,
        term: feesTable.term,
      })
      .from(feesTable)
      .where(
        and(
          eq(feesTable.status, "pending"),
          lt(feesTable.dueDate, today)
        )
      );

    if (overdueFees.length === 0) {
      logger.info({ job: "feeReminder" }, "No overdue fees found");
      return;
    }

    logger.warn(
      { job: "feeReminder", count: overdueFees.length },
      `Found ${overdueFees.length} overdue fee record(s)`
    );

    for (const fee of overdueFees) {
      // TODO: Replace this log with actual FCM push / SMS / email to the parent.
      // Example with FCM:
      //   await fcmAdmin.send({
      //     token: parentFcmToken,
      //     notification: {
      //       title: "Fee Due Reminder",
      //       body: `₹${fee.amount} was due on ${fee.dueDate}. Please pay at the earliest.`
      //     }
      //   });
      logger.info(
        { job: "feeReminder", studentId: fee.studentId, amount: fee.amount, dueDate: fee.dueDate, term: fee.term },
        "Overdue fee — notification would be sent here"
      );
    }
  } catch (err) {
    logger.error({ job: "feeReminder", err }, "Fee reminder job failed");
  }
}

// ─── Job 2: Daily Attendance Summary ─────────────────────────────────────────

/**
 * Every weekday (Mon–Fri) at 4:30 PM IST.
 * Reads today's attendance from Firestore via the DB or a direct
 * Firestore Admin call. Logs summary per class.
 *
 * NOTE: Attendance is currently stored in Firestore (DataContext),
 * not in the Drizzle DB. This job uses the Firebase Admin SDK
 * approach — reading from Firestore directly.
 * Once attendance is migrated to the Drizzle DB, replace with a
 * standard db.select() query.
 */
async function runAttendanceSummary() {
  const today = todayIST();
  logger.info({ job: "attendanceSummary", today }, "Running attendance summary job");

  try {
    // Dynamic import so the job file doesn't require firebase-admin at module
    // load time if you ever want to run jobs standalone.
    const { getApps, initializeApp, applicationDefault } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");

    if (getApps().length === 0) {
      initializeApp({ credential: applicationDefault() });
    }

    const firestore = getFirestore();
    const snapshot = await firestore
      .collection("attendance")
      .where("date", "==", today)
      .get();

    if (snapshot.empty) {
      logger.info({ job: "attendanceSummary", today }, "No attendance records found for today");
      return;
    }

    // Group by classSection and count present/absent/late
    const summaryMap: Record<string, { present: number; absent: number; late: number; total: number }> = {};

    for (const doc of snapshot.docs) {
      const data = doc.data() as {
        classSection: string;
        records: { studentId: string; status: "present" | "absent" | "late" }[];
      };

      const cls = data.classSection ?? "Unknown";
      if (!summaryMap[cls]) summaryMap[cls] = { present: 0, absent: 0, late: 0, total: 0 };

      for (const rec of data.records ?? []) {
        summaryMap[cls]!.total++;
        if (rec.status === "present") summaryMap[cls]!.present++;
        else if (rec.status === "absent") summaryMap[cls]!.absent++;
        else if (rec.status === "late") summaryMap[cls]!.late++;
      }
    }

    for (const [cls, stats] of Object.entries(summaryMap)) {
      const pct = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;
      logger.info(
        { job: "attendanceSummary", class: cls, ...stats, attendancePct: `${pct}%` },
        `Attendance summary for ${cls}: ${pct}% present`
      );

      // TODO: Send this summary to the class teacher via FCM/email.
      // You have the teacher's email from the staff collection.
    }
  } catch (err) {
    logger.error({ job: "attendanceSummary", err }, "Attendance summary job failed");
  }
}

// ─── Job 3: Keep-alive Ping ───────────────────────────────────────────────────

/**
 * Every 10 minutes — pings the health endpoint to prevent the server from
 * sleeping on free-tier platforms (Render free tier sleeps after 15 min idle).
 * Disable this job if running on a paid tier or self-hosted server.
 */
async function runKeepAlive() {
  const serverUrl = process.env["SERVER_URL"] ?? "http://localhost:3000";
  try {
    const res = await fetch(`${serverUrl}/api/healthz`);
    logger.info({ job: "keepAlive", status: res.status }, "Keep-alive ping OK");
  } catch (err) {
    logger.warn({ job: "keepAlive", err }, "Keep-alive ping failed (server may be restarting)");
  }
}

// ─── Register all jobs ────────────────────────────────────────────────────────

export function startCronJobs() {
  // Job 1: Fee reminders — every day at 8:00 AM IST (02:30 UTC)
  cron.schedule("30 2 * * *", () => void runFeeReminder(), {
    timezone: "Asia/Kolkata",
    scheduled: true,
  });

  // Job 2: Attendance summary — weekdays at 4:30 PM IST (11:00 UTC)
  cron.schedule("30 16 * * 1-5", () => void runAttendanceSummary(), {
    timezone: "Asia/Kolkata",
    scheduled: true,
  });

  // Job 3: Keep-alive ping — every 10 minutes
  const enableKeepAlive = process.env["ENABLE_KEEP_ALIVE"] !== "false";
  if (enableKeepAlive) {
    cron.schedule("*/10 * * * *", () => void runKeepAlive());
  }

  logger.info(
    { jobs: ["feeReminder @ 8:00 AM IST", "attendanceSummary @ 4:30 PM IST weekdays", enableKeepAlive ? "keepAlive @ every 10min" : "keepAlive DISABLED"] },
    "Cron jobs registered"
  );
}
