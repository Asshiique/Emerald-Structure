export interface Notice {
  id: string;
  title: string;
  body: string;
  category: "Urgent" | "Academic" | "Events" | "Fees" | "Sports" | "General";
  time: string;
  isRead: boolean;
  targetRole: string;
}

export interface Mark {
  subject: string;
  score: number;
  totalMarks: number;
  teacher: string;
  color: string;
  examType: string;
  term: string;
}

export interface AttendanceDay {
  date: string;
  status: "present" | "absent" | "late" | "holiday";
}

export interface FeeRecord {
  id: string;
  quarter: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  paidOn?: string;
  receiptNo?: string;
  dueDate: string;
}

export interface ScheduleSlot {
  time: string;
  subject: string;
  teacher: string;
  isActive?: boolean;
}

export interface TimetableDay {
  day: string;
  slots: ScheduleSlot[];
}

export interface Homework {
  id: string;
  subject: string;
  teacher: string;
  title: string;
  description: string;
  dueLabel: string;
  status: "pending" | "submitted" | "overdue";
}

export const NOTICES: Notice[] = [
  {
    id: "n1",
    title: "Fee Payment Reminder — Q3",
    body: "Last date for fee payment is 20th January. Late payments attract a penalty of ₹200. Please ensure timely payment to avoid inconvenience.",
    category: "Fees",
    time: "Today · 9:12 AM",
    isRead: false,
    targetRole: "all",
  },
  {
    id: "n2",
    title: "Tarang 2025 — Annual Day",
    body: "Rehearsals start Monday. Costume list shared separately. All participants must confirm attendance with the coordinator.",
    category: "Events",
    time: "Yesterday · 4:30 PM",
    isRead: false,
    targetRole: "all",
  },
  {
    id: "n3",
    title: "NEET Foundation — New Batch",
    body: "New NEET foundation batch begins for Class X students. Register with the office by Friday. Limited seats available.",
    category: "Academic",
    time: "Jan 10 · 11:00 AM",
    isRead: false,
    targetRole: "student",
  },
  {
    id: "n4",
    title: "Holiday — Pongal",
    body: "School will remain closed on 14th and 15th January on account of Pongal. Classes resume on 16th January.",
    category: "General",
    time: "Jan 9 · 8:00 AM",
    isRead: true,
    targetRole: "all",
  },
  {
    id: "n5",
    title: "Inter-School Football Tournament",
    body: "Our team plays on 18th Jan. Students are encouraged to support the team. Buses available from school at 9 AM.",
    category: "Sports",
    time: "Jan 8 · 3:00 PM",
    isRead: true,
    targetRole: "all",
  },
  {
    id: "n6",
    title: "Unit Test — Science Schedule",
    body: "Unit test for Science subjects scheduled for 22nd January. Syllabus: Chapter 1-4. Practical component included.",
    category: "Academic",
    time: "Jan 7 · 10:00 AM",
    isRead: true,
    targetRole: "student",
  },
];

export const MARKS: Mark[] = [
  { subject: "Mathematics", score: 88, totalMarks: 100, teacher: "Mr. Rajan", color: "#C0282A", examType: "Unit Test", term: "Term 2" },
  { subject: "Physics", score: 76, totalMarks: 100, teacher: "Ms. Priya", color: "#185FA5", examType: "Unit Test", term: "Term 2" },
  { subject: "English", score: 82, totalMarks: 100, teacher: "Ms. Anita", color: "#3B6D11", examType: "Unit Test", term: "Term 2" },
  { subject: "Chemistry", score: 71, totalMarks: 100, teacher: "Mr. Suresh", color: "#BA7517", examType: "Unit Test", term: "Term 2" },
  { subject: "Biology", score: 90, totalMarks: 100, teacher: "Ms. Nair", color: "#7B3F9E", examType: "Unit Test", term: "Term 2" },
  { subject: "Computer Science", score: 94, totalMarks: 100, teacher: "Mr. Vinod", color: "#1A7A6E", examType: "Unit Test", term: "Term 2" },
];

export const FEES: FeeRecord[] = [
  { id: "f1", quarter: "Q1 — April to June", amount: 18500, status: "paid", paidOn: "Apr 5, 2024", receiptNo: "EIS/2024/001", dueDate: "Apr 10, 2024" },
  { id: "f2", quarter: "Q2 — July to September", amount: 18500, status: "paid", paidOn: "Jul 8, 2024", receiptNo: "EIS/2024/102", dueDate: "Jul 10, 2024" },
  { id: "f3", quarter: "Q3 — October to December", amount: 18500, status: "overdue", dueDate: "Jan 20, 2025" },
  { id: "f4", quarter: "Annual Fee", amount: 5000, status: "paid", paidOn: "Mar 15, 2024", receiptNo: "EIS/2024/ANN", dueDate: "Mar 31, 2024" },
];

export const TODAY_SCHEDULE: ScheduleSlot[] = [
  { time: "8:00 AM", subject: "Mathematics", teacher: "Mr. Rajan" },
  { time: "9:00 AM", subject: "Physics", teacher: "Ms. Priya", isActive: true },
  { time: "10:00 AM", subject: "English", teacher: "Ms. Anita" },
  { time: "11:15 AM", subject: "Chemistry", teacher: "Mr. Suresh" },
  { time: "12:30 PM", subject: "Lunch Break", teacher: "" },
  { time: "1:30 PM", subject: "Biology", teacher: "Ms. Nair" },
  { time: "2:30 PM", subject: "Computer Science", teacher: "Mr. Vinod" },
];

export const TIMETABLE: TimetableDay[] = [
  {
    day: "Monday",
    slots: [
      { time: "8:00", subject: "Mathematics", teacher: "Mr. Rajan" },
      { time: "9:00", subject: "Physics", teacher: "Ms. Priya" },
      { time: "10:00", subject: "English", teacher: "Ms. Anita" },
      { time: "11:15", subject: "Chemistry", teacher: "Mr. Suresh" },
      { time: "1:30", subject: "Biology", teacher: "Ms. Nair" },
      { time: "2:30", subject: "Computer Science", teacher: "Mr. Vinod" },
    ],
  },
  {
    day: "Tuesday",
    slots: [
      { time: "8:00", subject: "English", teacher: "Ms. Anita" },
      { time: "9:00", subject: "Mathematics", teacher: "Mr. Rajan" },
      { time: "10:00", subject: "Computer Science", teacher: "Mr. Vinod" },
      { time: "11:15", subject: "Physics", teacher: "Ms. Priya" },
      { time: "1:30", subject: "Chemistry", teacher: "Mr. Suresh" },
      { time: "2:30", subject: "Biology", teacher: "Ms. Nair" },
    ],
  },
  {
    day: "Wednesday",
    slots: [
      { time: "8:00", subject: "Biology", teacher: "Ms. Nair" },
      { time: "9:00", subject: "English", teacher: "Ms. Anita" },
      { time: "10:00", subject: "Mathematics", teacher: "Mr. Rajan" },
      { time: "11:15", subject: "Computer Science", teacher: "Mr. Vinod" },
      { time: "1:30", subject: "Physics", teacher: "Ms. Priya" },
      { time: "2:30", subject: "Chemistry", teacher: "Mr. Suresh" },
    ],
  },
  {
    day: "Thursday",
    slots: [
      { time: "8:00", subject: "Chemistry", teacher: "Mr. Suresh" },
      { time: "9:00", subject: "Biology", teacher: "Ms. Nair" },
      { time: "10:00", subject: "Physics", teacher: "Ms. Priya" },
      { time: "11:15", subject: "English", teacher: "Ms. Anita" },
      { time: "1:30", subject: "Mathematics", teacher: "Mr. Rajan" },
      { time: "2:30", subject: "Computer Science", teacher: "Mr. Vinod" },
    ],
  },
  {
    day: "Friday",
    slots: [
      { time: "8:00", subject: "Computer Science", teacher: "Mr. Vinod" },
      { time: "9:00", subject: "Chemistry", teacher: "Mr. Suresh" },
      { time: "10:00", subject: "Biology", teacher: "Ms. Nair" },
      { time: "11:15", subject: "Mathematics", teacher: "Mr. Rajan" },
      { time: "1:30", subject: "English", teacher: "Ms. Anita" },
      { time: "2:30", subject: "Physics", teacher: "Ms. Priya" },
    ],
  },
];

export const HOMEWORK: Homework[] = [
  {
    id: "hw1",
    subject: "Mathematics",
    teacher: "Mr. Rajan",
    title: "Exercise 5.3 — Quadratic Equations",
    description: "Complete problems 1 to 15 from page 98. Show full working for each step.",
    dueLabel: "Tomorrow",
    status: "pending",
  },
  {
    id: "hw2",
    subject: "Physics",
    teacher: "Ms. Priya",
    title: "Lab Report — Ohm's Law",
    description: "Write the complete lab report including observations, calculations, and conclusions.",
    dueLabel: "Friday",
    status: "pending",
  },
  {
    id: "hw3",
    subject: "English",
    teacher: "Ms. Anita",
    title: "Essay — My Favourite Festival",
    description: "Write a 300-word essay. Focus on descriptive language and personal experience.",
    dueLabel: "Next Monday",
    status: "pending",
  },
  {
    id: "hw4",
    subject: "Chemistry",
    teacher: "Mr. Suresh",
    title: "Periodic Table Review",
    description: "Memorize the first 20 elements with symbols and atomic numbers. Quiz on Friday.",
    dueLabel: "Overdue",
    status: "overdue",
  },
  {
    id: "hw5",
    subject: "Biology",
    teacher: "Ms. Nair",
    title: "Diagram — Human Heart",
    description: "Draw and label the human heart with all four chambers, valves, and major blood vessels.",
    dueLabel: "Submitted",
    status: "submitted",
  },
];

export function generateAttendance(): AttendanceDay[] {
  const days: AttendanceDay[] = [];
  for (let d = 1; d <= 17; d++) {
    const date = new Date(2025, 0, d);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      days.push({ date: `2025-01-${String(d).padStart(2, "0")}`, status: "holiday" });
    } else if (d === 14 || d === 15) {
      days.push({ date: `2025-01-${String(d).padStart(2, "0")}`, status: "holiday" });
    } else if (d === 3 || d === 10) {
      days.push({ date: `2025-01-${String(d).padStart(2, "0")}`, status: "absent" });
    } else {
      days.push({ date: `2025-01-${String(d).padStart(2, "0")}`, status: "present" });
    }
  }
  return days;
}
