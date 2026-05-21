/**
 * Shared TypeScript types for the Student of the Month recognition feature.
 * IMPORTANT: No `points` field is exposed on parent-facing types — intentional.
 */

export type PointCategory =
  | "curricular"
  | "non_curricular"
  | "discipline"
  | "homework"
  | "behaviour";

export const CATEGORY_LABELS: Record<PointCategory, string> = {
  curricular: "Curricular",
  non_curricular: "Non-Curricular",
  discipline: "Discipline",
  homework: "Homework",
  behaviour: "Behaviour",
};

/** Full audit record — visible to admin/teacher only, never to parents */
export interface PointAward {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  classSection: string;
  category: PointCategory;
  points: number;
  note?: string;
  awardedAt: string; // ISO string
}

/**
 * Winner announcement — parent-safe shape.
 * Intentionally has NO points, NO category breakdown.
 */
export interface MonthlyWinner {
  studentId: string;
  studentName: string;
  classSection: string;
  month: number; // 1–12
  year: number;
  // NO points field — intentional
}

/** Admin-only shape returned during leaderboard preview */
export interface WinnerAnnouncement {
  winner: MonthlyWinner;
  isRepeatWinner: boolean; // admin warning only — never shown to parents
}

export const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
