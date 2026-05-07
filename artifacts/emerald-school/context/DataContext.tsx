import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export const PROTECTED_ADMIN_EMAILS = new Set([
  "ashiquemuhammed057@gmail.com",
  "emeraldinternationalmkd@gmail.com",
  "shiyasrgz@gmail.com",
]);

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: "Class Teacher" | "Subject Teacher" | "Office Staff" | "Supporting Staff" | "Principal" | "Vice Principal";
  department: string;
  classSection: string;
  joinDate: string;
  employeeId: string;
  isActive: boolean;
  profilePhoto?: string;
}

export interface Student {
  id: string;
  name: string;
  dob: string;
  gender: "Male" | "Female";
  bloodGroup: string;
  classSection: string;
  rollNo: string;
  admissionNo: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentWhatsApp: string;
  address: string;
  prevSchool: string;
  profilePhoto?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  classSection: string;
  teacherId: string;
  records: Array<{ studentId: string; studentName: string; status: "present" | "absent" | "late" }>;
}

export interface HomeworkEntry {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  classSection: string;
  title: string;
  description: string;
  dueDate: string;
  postedAt: string;
}

export interface Evaluation {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  classSection: string;
  ratings: {
    teachingQuality: number;
    classroomManagement: number;
    studentEngagement: number;
    punctuality: number;
    parentCommunication: number;
    homeworkManagement: number;
  };
  strengths: string;
  improvements: string;
  remarks: string;
  overallRating: number;
  date: string;
}

export interface AppSettings {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
  academicYear: string;
  schoolLogo?: string;
}

export interface TimetableSlot {
  time: string;
  subject: string;
  teacher: string;
}

export interface TimetableDay {
  day: string;
  slots: TimetableSlot[];
}

export interface AppNotice {
  id: string;
  title: string;
  body: string;
  category: "Urgent" | "Academic" | "Events" | "Fees" | "Sports" | "General";
  time: string;
  postedAt: string;
  isRead: boolean;
  targetRole: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: "Events" | "Sports" | "Academic" | "Cultural";
  date: string;
  photo: string;
  uploadedAt: string;
}

export interface AppData {
  setupComplete: boolean;
  staff: StaffMember[];
  students: Student[];
  attendance: AttendanceRecord[];
  homework: HomeworkEntry[];
  evaluations: Evaluation[];
  settings: AppSettings;
  firstLoginParents: string[];
  timetable: TimetableDay[];
  notices: AppNotice[];
  gallery: GalleryItem[];
}

const STORAGE_KEY = "@emerald_app_data";

const SEED_DATA: AppData = {
  setupComplete: true,
  settings: {
    schoolName: "Emerald International School",
    address: "Mannarkkad, Palakkad, Kerala 678583",
    phone: "+91 4924 222 001",
    email: "info@emeraldschool.edu",
    principalName: "Dr. Thomas Joseph",
    academicYear: "2024-25",
  },
  firstLoginParents: [],
  gallery: [],
  notices: [
    { id: "n1", title: "Fee Payment Reminder — Q3", body: "Last date for fee payment is 20th January. Late payments attract a penalty of ₹200. Please ensure timely payment to avoid inconvenience.", category: "Fees", time: "Today · 9:12 AM", postedAt: "2025-01-15T09:12:00Z", isRead: false, targetRole: "all" },
    { id: "n2", title: "Tarang 2025 — Annual Day", body: "Rehearsals start Monday. Costume list shared separately. All participants must confirm attendance with the coordinator.", category: "Events", time: "Yesterday · 4:30 PM", postedAt: "2025-01-14T16:30:00Z", isRead: false, targetRole: "all" },
    { id: "n3", title: "NEET Foundation — New Batch", body: "New NEET foundation batch begins for Class X students. Register with the office by Friday. Limited seats available.", category: "Academic", time: "Jan 10 · 11:00 AM", postedAt: "2025-01-10T11:00:00Z", isRead: false, targetRole: "student" },
    { id: "n4", title: "Holiday — Pongal", body: "School will remain closed on 14th and 15th January on account of Pongal. Classes resume on 16th January.", category: "General", time: "Jan 9 · 8:00 AM", postedAt: "2025-01-09T08:00:00Z", isRead: true, targetRole: "all" },
    { id: "n5", title: "Inter-School Football Tournament", body: "Our team plays on 18th Jan. Students are encouraged to support the team. Buses available from school at 9 AM.", category: "Sports", time: "Jan 8 · 3:00 PM", postedAt: "2025-01-08T15:00:00Z", isRead: true, targetRole: "all" },
  ],
  timetable: [
    { day: "Monday", slots: [{ time: "8:00", subject: "Mathematics", teacher: "Mr. Rajan Krishnan" }, { time: "9:00", subject: "Physics", teacher: "Ms. Priya Menon" }, { time: "10:00", subject: "English", teacher: "Ms. Anita George" }, { time: "11:15", subject: "Chemistry", teacher: "Mr. Suresh Kumar" }, { time: "1:30", subject: "Biology", teacher: "Ms. Lakshmi Nair" }, { time: "2:30", subject: "Computer Science", teacher: "Mr. Vinod Thomas" }] },
    { day: "Tuesday", slots: [{ time: "8:00", subject: "English", teacher: "Ms. Anita George" }, { time: "9:00", subject: "Mathematics", teacher: "Mr. Rajan Krishnan" }, { time: "10:00", subject: "Computer Science", teacher: "Mr. Vinod Thomas" }, { time: "11:15", subject: "Physics", teacher: "Ms. Priya Menon" }, { time: "1:30", subject: "Chemistry", teacher: "Mr. Suresh Kumar" }, { time: "2:30", subject: "Biology", teacher: "Ms. Lakshmi Nair" }] },
    { day: "Wednesday", slots: [{ time: "8:00", subject: "Biology", teacher: "Ms. Lakshmi Nair" }, { time: "9:00", subject: "English", teacher: "Ms. Anita George" }, { time: "10:00", subject: "Mathematics", teacher: "Mr. Rajan Krishnan" }, { time: "11:15", subject: "Computer Science", teacher: "Mr. Vinod Thomas" }, { time: "1:30", subject: "Physics", teacher: "Ms. Priya Menon" }, { time: "2:30", subject: "Chemistry", teacher: "Mr. Suresh Kumar" }] },
    { day: "Thursday", slots: [{ time: "8:00", subject: "Chemistry", teacher: "Mr. Suresh Kumar" }, { time: "9:00", subject: "Biology", teacher: "Ms. Lakshmi Nair" }, { time: "10:00", subject: "Physics", teacher: "Ms. Priya Menon" }, { time: "11:15", subject: "English", teacher: "Ms. Anita George" }, { time: "1:30", subject: "Mathematics", teacher: "Mr. Rajan Krishnan" }, { time: "2:30", subject: "Computer Science", teacher: "Mr. Vinod Thomas" }] },
    { day: "Friday", slots: [{ time: "8:00", subject: "Computer Science", teacher: "Mr. Vinod Thomas" }, { time: "9:00", subject: "Chemistry", teacher: "Mr. Suresh Kumar" }, { time: "10:00", subject: "Biology", teacher: "Ms. Lakshmi Nair" }, { time: "11:15", subject: "Mathematics", teacher: "Mr. Rajan Krishnan" }, { time: "1:30", subject: "English", teacher: "Ms. Anita George" }, { time: "2:30", subject: "Physics", teacher: "Ms. Priya Menon" }] },
    { day: "Saturday", slots: [{ time: "8:00", subject: "Mathematics", teacher: "Mr. Rajan Krishnan" }, { time: "9:00", subject: "Computer Science", teacher: "Mr. Vinod Thomas" }] },
  ],
  staff: [
    { id: "staff_001", name: "Mr. Rajan Krishnan", phone: "+91 98765 11001", email: "rajan@emerald.edu", role: "Class Teacher", department: "Mathematics", classSection: "X-B", joinDate: "2018-06-01", employeeId: "EIS/TCH/018", isActive: true },
    { id: "staff_002", name: "Ms. Priya Menon", phone: "+91 98765 11002", email: "priya@emerald.edu", role: "Subject Teacher", department: "Physics", classSection: "X-B", joinDate: "2020-06-01", employeeId: "EIS/TCH/020", isActive: true },
    { id: "staff_003", name: "Ms. Anita George", phone: "+91 98765 11003", email: "anita@emerald.edu", role: "Subject Teacher", department: "English", classSection: "X-B", joinDate: "2019-06-01", employeeId: "EIS/TCH/019", isActive: true },
    { id: "staff_004", name: "Mr. Suresh Kumar", phone: "+91 98765 11004", email: "suresh@emerald.edu", role: "Subject Teacher", department: "Chemistry", classSection: "X-B", joinDate: "2021-06-01", employeeId: "EIS/TCH/021", isActive: true },
    { id: "staff_005", name: "Ms. Lakshmi Nair", phone: "+91 98765 11005", email: "nair@emerald.edu", role: "Subject Teacher", department: "Biology", classSection: "X-B", joinDate: "2017-06-01", employeeId: "EIS/TCH/017", isActive: true },
    { id: "staff_006", name: "Mr. Vinod Thomas", phone: "+91 98765 11006", email: "vinod@emerald.edu", role: "Subject Teacher", department: "Computer Science", classSection: "X-B", joinDate: "2022-06-01", employeeId: "EIS/TCH/022", isActive: true },
    { id: "staff_007", name: "Ms. Sheela Varma", phone: "+91 98765 11007", email: "sheela@emerald.edu", role: "Office Staff", department: "Office", classSection: "", joinDate: "2015-06-01", employeeId: "EIS/OFF/015", isActive: true },
  ],
  students: [
    { id: "stu_001", name: "Aryan Sharma", dob: "2009-03-12", gender: "Male", bloodGroup: "A+", classSection: "X-B", rollNo: "1", admissionNo: "EIS/2024/1024", parentName: "Rajesh Sharma", parentPhone: "+91 98765 43210", parentEmail: "parent@emerald.edu", parentWhatsApp: "+91 98765 43210", address: "12, Gandhi Nagar, Mannarkkad", prevSchool: "St. Mary's School" },
    { id: "stu_002", name: "Meera Pillai", dob: "2009-07-22", gender: "Female", bloodGroup: "B+", classSection: "X-B", rollNo: "2", admissionNo: "EIS/2024/1025", parentName: "Suresh Pillai", parentPhone: "+91 98765 43211", parentEmail: "meera.parent@emerald.edu", parentWhatsApp: "+91 98765 43211", address: "45, MG Road, Mannarkkad", prevSchool: "" },
    { id: "stu_003", name: "Aditya Nair", dob: "2009-11-05", gender: "Male", bloodGroup: "O+", classSection: "X-B", rollNo: "3", admissionNo: "EIS/2024/1026", parentName: "Vijay Nair", parentPhone: "+91 98765 43212", parentEmail: "aditya.parent@emerald.edu", parentWhatsApp: "+91 98765 43212", address: "78, Nehru Street, Palakkad", prevSchool: "Central School" },
    { id: "stu_004", name: "Priya Thomas", dob: "2009-02-18", gender: "Female", bloodGroup: "AB+", classSection: "X-B", rollNo: "4", admissionNo: "EIS/2024/1027", parentName: "George Thomas", parentPhone: "+91 98765 43213", parentEmail: "priya.parent@emerald.edu", parentWhatsApp: "+91 98765 43213", address: "22, Church Road, Mannarkkad", prevSchool: "" },
    { id: "stu_005", name: "Rahul Menon", dob: "2009-09-30", gender: "Male", bloodGroup: "B-", classSection: "X-B", rollNo: "5", admissionNo: "EIS/2024/1028", parentName: "Ravi Menon", parentPhone: "+91 98765 43214", parentEmail: "rahul.parent@emerald.edu", parentWhatsApp: "+91 98765 43214", address: "56, Lake View, Mannarkkad", prevSchool: "Kendriya Vidyalaya" },
  ],
  attendance: [],
  homework: [
    { id: "ehw_001", teacherId: "staff_001", teacherName: "Mr. Rajan Krishnan", subject: "Mathematics", classSection: "X-B", title: "Exercise 5.3 — Quadratic Equations", description: "Complete problems 1 to 15 from page 98. Show full working.", dueDate: "2025-01-20", postedAt: "2025-01-15T10:00:00Z" },
    { id: "ehw_002", teacherId: "staff_002", teacherName: "Ms. Priya Menon", subject: "Physics", classSection: "X-B", title: "Lab Report — Ohm's Law", description: "Write the complete lab report with observations and conclusions.", dueDate: "2025-01-22", postedAt: "2025-01-15T11:00:00Z" },
    { id: "ehw_003", teacherId: "staff_003", teacherName: "Ms. Anita George", subject: "English", classSection: "X-B", title: "Essay — My Favourite Festival", description: "Write a 300-word essay. Focus on descriptive language and personal experience.", dueDate: "2025-01-27", postedAt: "2025-01-14T09:00:00Z" },
  ],
  evaluations: [
    { id: "eval_001", teacherId: "staff_001", teacherName: "Mr. Rajan Krishnan", subject: "Mathematics", classSection: "X-B", ratings: { teachingQuality: 5, classroomManagement: 4, studentEngagement: 5, punctuality: 5, parentCommunication: 4, homeworkManagement: 4 }, strengths: "Excellent command over the subject.", improvements: "Could improve parent communication.", remarks: "One of our best teachers.", overallRating: 5, date: "2024-11-15" },
  ],
};

interface DataContextType {
  data: AppData;
  isLoading: boolean;
  completeSetup: (name: string, email: string, phone: string) => Promise<void>;
  addStaff: (s: Omit<StaffMember, "id" | "isActive">) => Promise<StaffMember>;
  updateStaff: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  removeStaff: (id: string) => Promise<void>;
  addStudent: (s: Omit<Student, "id">) => Promise<Student>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  markAttendance: (rec: Omit<AttendanceRecord, "id">) => Promise<void>;
  getAttendanceForDate: (date: string, classSection: string) => AttendanceRecord | undefined;
  addHomework: (hw: Omit<HomeworkEntry, "id" | "postedAt">) => Promise<HomeworkEntry>;
  addEvaluation: (ev: Omit<Evaluation, "id">) => Promise<void>;
  updateEvaluation: (id: string, updates: Partial<Evaluation>) => Promise<void>;
  updateSettings: (s: Partial<AppSettings>) => Promise<void>;
  updateTimetable: (day: string, slots: TimetableSlot[]) => Promise<void>;
  addNotice: (n: Omit<AppNotice, "id" | "isRead">) => Promise<void>;
  markNoticeRead: (id: string) => Promise<void>;
  markParentFirstLogin: (email: string) => Promise<void>;
  addGalleryPhoto: (item: Omit<GalleryItem, "id" | "uploadedAt">) => Promise<void>;
  removeGalleryPhoto: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
async function persist(data: AppData) { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(SEED_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          const parsed: AppData = JSON.parse(stored);
          if (!parsed.notices) parsed.notices = SEED_DATA.notices;
          if (!parsed.timetable) parsed.timetable = SEED_DATA.timetable;
          if (!parsed.gallery) parsed.gallery = [];
          setData(parsed);
        } catch {}
      } else {
        persist(SEED_DATA);
      }
      setIsLoading(false);
    });
  }, []);

  const update = useCallback(async (fn: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, []);

  const completeSetup = async (name: string, email: string, phone: string) => {
    const adminStaff: StaffMember = { id: "staff_admin_" + uid(), name, email, phone, role: "Principal", department: "Administration", classSection: "", joinDate: new Date().toISOString().split("T")[0], employeeId: "EIS/ADM/001", isActive: true };
    await update((prev) => ({ ...prev, setupComplete: true, staff: [adminStaff, ...prev.staff] }));
  };
  const addStaff = async (s: Omit<StaffMember, "id" | "isActive">) => { const member: StaffMember = { ...s, id: "staff_" + uid(), isActive: true }; await update((prev) => ({ ...prev, staff: [...prev.staff, member] })); return member; };
  const updateStaff = async (id: string, updates: Partial<StaffMember>) => { await update((prev) => ({ ...prev, staff: prev.staff.map((s) => (s.id === id ? { ...s, ...updates } : s)) })); };
  const removeStaff = async (id: string) => {
    const member = data.staff.find((s) => s.id === id);
    if (member && PROTECTED_ADMIN_EMAILS.has(member.email.toLowerCase())) {
      throw new Error("This account is protected and cannot be removed.");
    }
    await update((prev) => ({ ...prev, staff: prev.staff.map((s) => (s.id === id ? { ...s, isActive: false } : s)) }));
  };
  const addStudent = async (s: Omit<Student, "id">) => { const student: Student = { ...s, id: "stu_" + uid() }; await update((prev) => ({ ...prev, students: [...prev.students, student] })); return student; };
  const updateStudent = async (id: string, updates: Partial<Student>) => { await update((prev) => ({ ...prev, students: prev.students.map((s) => (s.id === id ? { ...s, ...updates } : s)) })); };
  const removeStudent = async (id: string) => { await update((prev) => ({ ...prev, students: prev.students.filter((s) => s.id !== id) })); };
  const getAttendanceForDate = (date: string, classSection: string) => data.attendance.find((a) => a.date === date && a.classSection === classSection);
  const markAttendance = async (rec: Omit<AttendanceRecord, "id">) => {
    const existing = getAttendanceForDate(rec.date, rec.classSection);
    if (existing) {
      await update((prev) => ({ ...prev, attendance: prev.attendance.map((a) => (a.date === rec.date && a.classSection === rec.classSection ? { ...a, records: rec.records, teacherId: rec.teacherId } : a)) }));
    } else {
      const record: AttendanceRecord = { ...rec, id: "att_" + uid() };
      await update((prev) => ({ ...prev, attendance: [...prev.attendance, record] }));
    }
  };
  const addHomework = async (hw: Omit<HomeworkEntry, "id" | "postedAt">) => { const entry: HomeworkEntry = { ...hw, id: "hw_" + uid(), postedAt: new Date().toISOString() }; await update((prev) => ({ ...prev, homework: [entry, ...prev.homework] })); return entry; };
  const addEvaluation = async (ev: Omit<Evaluation, "id">) => { const entry: Evaluation = { ...ev, id: "eval_" + uid() }; await update((prev) => ({ ...prev, evaluations: [entry, ...prev.evaluations] })); };
  const updateEvaluation = async (id: string, updates: Partial<Evaluation>) => { await update((prev) => ({ ...prev, evaluations: prev.evaluations.map((e) => (e.id === id ? { ...e, ...updates } : e)) })); };
  const updateSettings = async (s: Partial<AppSettings>) => { await update((prev) => ({ ...prev, settings: { ...prev.settings, ...s } })); };
  const updateTimetable = async (day: string, slots: TimetableSlot[]) => { await update((prev) => ({ ...prev, timetable: prev.timetable.map((d) => (d.day === day ? { ...d, slots } : d)) })); };
  const addNotice = async (n: Omit<AppNotice, "id" | "isRead">) => { const notice: AppNotice = { ...n, id: "notice_" + uid(), isRead: false }; await update((prev) => ({ ...prev, notices: [notice, ...prev.notices] })); };
  const markNoticeRead = async (id: string) => { await update((prev) => ({ ...prev, notices: prev.notices.map((n) => (n.id === id ? { ...n, isRead: true } : n)) })); };
  const markParentFirstLogin = async (email: string) => { await update((prev) => ({ ...prev, firstLoginParents: prev.firstLoginParents.includes(email) ? prev.firstLoginParents : [...prev.firstLoginParents, email] })); };
  const addGalleryPhoto = async (item: Omit<GalleryItem, "id" | "uploadedAt">) => { const entry: GalleryItem = { ...item, id: "gal_" + uid(), uploadedAt: new Date().toISOString() }; await update((prev) => ({ ...prev, gallery: [entry, ...prev.gallery] })); };
  const removeGalleryPhoto = async (id: string) => { await update((prev) => ({ ...prev, gallery: prev.gallery.filter((g) => g.id !== id) })); };

  return (
    <DataContext.Provider value={{ data, isLoading, completeSetup, addStaff, updateStaff, removeStaff, addStudent, updateStudent, removeStudent, markAttendance, getAttendanceForDate, addHomework, addEvaluation, updateEvaluation, updateSettings, updateTimetable, addNotice, markNoticeRead, markParentFirstLogin, addGalleryPhoto, removeGalleryPhoto }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() { const ctx = useContext(DataContext); if (!ctx) throw new Error("useData must be used within DataProvider"); return ctx; }

export async function findAccountByEmail(email: string) {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const appData: AppData = stored ? JSON.parse(stored) : SEED_DATA;
    const normalized = email.toLowerCase().trim();
    const staffMember = appData.staff.find((s) => s.email.toLowerCase() === normalized && s.isActive);
    if (staffMember) {
      const isAdmin = staffMember.role === "Principal" || staffMember.role === "Vice Principal";
      return { uid: staffMember.id, name: staffMember.name, role: isAdmin ? ("admin" as const) : ("teacher" as const), classSection: staffMember.classSection, rollNo: staffMember.employeeId, parentName: "", phone: staffMember.phone, email: staffMember.email, department: staffMember.department };
    }
    const student = appData.students.find((s) => s.parentEmail.toLowerCase() === normalized);
    if (student) {
      return { uid: student.id, name: student.name, role: "parent" as const, classSection: student.classSection, rollNo: student.admissionNo, parentName: student.parentName, phone: student.parentPhone, email: student.parentEmail, department: "" };
    }
  } catch {}
  return null;
}
