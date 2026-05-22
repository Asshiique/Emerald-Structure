import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { createFirebaseAccount } from "@/lib/firebaseBootstrap";
import { getCourseFee } from "@/lib/feeUtils";
import { useAuth } from "./AuthContext";

export const PROTECTED_ADMIN_EMAILS = new Set([
  "ashiquemuhammed057@gmail.com",
  "emeraldinternationalschoolmkd@gmail.com",
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
  parentUid?: string;
}

export interface OtherFeeItem {
  id: string;
  label: string;
  amount: number;
}

export interface PaymentEntry {
  id: string;
  amount: number;
  date: string;
  note: string;
  recordedBy: string;
}

export interface FeeRecord {
  id: string;          // = studentId
  studentId: string;
  studentName: string;
  classSection: string;
  parentEmail: string;
  parentName: string;
  courseFee: number;
  busFee: number;
  otherFees: OtherFeeItem[];
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  payments: PaymentEntry[];
  lastUpdated: string;
}

function makeFeeRecord(student: Student): FeeRecord {
  const courseFee = getCourseFee(student.classSection);
  return {
    id: student.id,
    studentId: student.id,
    studentName: student.name,
    classSection: student.classSection,
    parentEmail: student.parentEmail,
    parentName: student.parentName,
    courseFee,
    busFee: 0,
    otherFees: [],
    totalFee: courseFee,
    paidAmount: 0,
    pendingAmount: courseFee,
    payments: [],
    lastUpdated: new Date().toISOString(),
  };
}

function recomputeTotals(rec: Partial<FeeRecord>): Pick<FeeRecord, "totalFee" | "pendingAmount"> {
  const total = (rec.courseFee ?? 0) + (rec.busFee ?? 0) + (rec.otherFees ?? []).reduce((s, f) => s + f.amount, 0);
  return { totalFee: total, pendingAmount: total - (rec.paidAmount ?? 0) };
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
  /** Display-only time string derived from postedAt — not stored in DB */
  time: string;
  postedAt: string;
  isRead: boolean;
  targetRole: string;
}

// NOTE: AppNotice is kept for backward-compat with any remaining DataContext
// consumers. New code should use the Notice type from @workspace/api-client-react
// via hooks/useNotices.ts instead.

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
  gallery: GalleryItem[];
  fees: FeeRecord[];
  // notices intentionally removed — now managed by React Query via /api/notices
}

const DEFAULT_SETTINGS: AppSettings = {
  schoolName: "Emerald International School",
  address: "Vadakkumannam, Mannarkkad, Palakkad, Kerala",
  phone: "+91 6238960292, +91 7356596745",
  email: "emeraldinternationalschoolmkd@gmail.com",
  principalName: "Shalima Soman",
  academicYear: "2025-26",
};

const INITIAL_DATA: AppData = {
  setupComplete: true,
  settings: DEFAULT_SETTINGS,
  firstLoginParents: [],
  staff: [],
  students: [],
  attendance: [],
  homework: [],
  evaluations: [],
  gallery: [],
  timetable: [],
  fees: [],
};

const READ_NOTICES_KEY = "@emerald_read_notice_ids";

interface DataContextType {
  data: AppData;
  isLoading: boolean;
  completeSetup: (name: string, email: string, phone: string) => Promise<void>;
  addStaff: (s: Omit<StaffMember, "id" | "isActive">, password?: string) => Promise<StaffMember>;
  updateStaff: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  removeStaff: (id: string) => Promise<void>;
  addStudent: (s: Omit<Student, "id">, password?: string) => Promise<Student>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  markAttendance: (rec: Omit<AttendanceRecord, "id">) => Promise<void>;
  getAttendanceForDate: (date: string, classSection: string) => AttendanceRecord | undefined;
  addHomework: (hw: Omit<HomeworkEntry, "id" | "postedAt">) => Promise<HomeworkEntry>;
  addEvaluation: (ev: Omit<Evaluation, "id">) => Promise<void>;
  updateEvaluation: (id: string, updates: Partial<Evaluation>) => Promise<void>;
  updateSettings: (s: Partial<AppSettings>) => Promise<void>;
  updateTimetable: (day: string, slots: TimetableSlot[]) => Promise<void>;
  /** @deprecated Use useMarkNoticeReadLocally() from hooks/useNotices.ts instead */
  markNoticeRead: (id: string) => Promise<void>;
  markParentFirstLogin: (email: string) => Promise<void>;
  addGalleryPhoto: (item: Omit<GalleryItem, "id" | "uploadedAt">) => Promise<void>;
  removeGalleryPhoto: (id: string) => Promise<void>;
  // ── Fee management ──────────────────────────────────────────────────────────
  initStudentFee: (student: Student) => Promise<void>;
  recordFeePayment: (studentId: string, amount: number, note: string, recordedBy: string) => Promise<void>;
  setStudentBusFee: (studentId: string, amount: number) => Promise<void>;
  addStudentOtherFee: (studentId: string, label: string, amount: number) => Promise<void>;
  removeStudentOtherFee: (studentId: string, feeItemId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

  // NOTE: Read-notice IDs are now persisted by hooks/useNotices.ts.
  // This ref is kept so markNoticeRead below remains functional for any
  // remaining callers; the canonical source of truth is AsyncStorage.
  const readIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(READ_NOTICES_KEY).then((s) => {
      if (s) readIds.current = new Set(JSON.parse(s));
    });
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setData(INITIAL_DATA);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubs: (() => void)[] = [];
    let essential = 0;
    const markEssential = () => { if (++essential >= 3) setIsLoading(false); };
    const fallback = setTimeout(() => setIsLoading(false), 6000);

    // ── Role helpers ─────────────────────────────────────────────────────────
    const isAdmin = user.role === "admin";
    const isTeacher = user.role === "teacher";
    const isParentOrStudent = user.role === "parent" || user.role === "student";

    // ── Settings (essential #1) — everyone ───────────────────────────────────
    unsubs.push(
      onSnapshot(doc(db, "settings", "main"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setData((prev) => ({
            ...prev,
            settings: {
              schoolName: d.schoolName ?? DEFAULT_SETTINGS.schoolName,
              address: d.address ?? DEFAULT_SETTINGS.address,
              phone: d.phone ?? DEFAULT_SETTINGS.phone,
              email: d.email ?? DEFAULT_SETTINGS.email,
              principalName: d.principalName ?? DEFAULT_SETTINGS.principalName,
              academicYear: d.academicYear ?? DEFAULT_SETTINGS.academicYear,
              schoolLogo: d.schoolLogo,
            },
            firstLoginParents: d.firstLoginParents ?? [],
            timetable: d.timetable ?? [],
          }));
        }
        markEssential();
      })
    );

    // ── Staff directory (essential #2) — everyone ─────────────────────────────
    unsubs.push(
      onSnapshot(collection(db, "staff"), (snap) => {
        setData((prev) => ({
          ...prev,
          staff: snap.docs.map((d) => ({ ...d.data(), id: d.id } as StaffMember)),
        }));
        markEssential();
      })
    );

    // ── Students (essential #3) — ROLE FILTERED ───────────────────────────────
    // Admin   : entire collection (needed for student management)
    // Teacher : their class section only
    // Parent  : their own child only (matched by parentEmail — always set on student docs)
    const studentsQuery = isAdmin
      ? collection(db, "students")
      : isTeacher && user.classSection
        ? query(collection(db, "students"), where("classSection", "==", user.classSection))
        : isParentOrStudent && user.email
          ? query(collection(db, "students"), where("parentEmail", "==", user.email))
          : null;

    if (studentsQuery) {
      unsubs.push(
        onSnapshot(studentsQuery, (snap) => {
          setData((prev) => ({
            ...prev,
            students: snap.docs.map((d) => ({ ...d.data(), id: d.id } as Student)),
          }));
          markEssential();
        })
      );
    } else {
      markEssential(); // Unblock loading even if no query applies
    }

    // ── Homework — everyone (assignment titles are not sensitive) ─────────────
    unsubs.push(
      onSnapshot(
        query(collection(db, "homework"), orderBy("postedAt", "desc")),
        (snap) => {
          setData((prev) => ({
            ...prev,
            homework: snap.docs.map((d) => ({ ...d.data(), id: d.id } as HomeworkEntry)),
          }));
        }
      )
    );

    // ── Attendance — class-scoped for non-admins ──────────────────────────────
    // Records are per-class per-day (not per-student), so class-level access is fine.
    const attendanceQuery = isAdmin
      ? collection(db, "attendance")
      : user.classSection
        ? query(collection(db, "attendance"), where("classSection", "==", user.classSection))
        : null;

    if (attendanceQuery) {
      unsubs.push(
        onSnapshot(attendanceQuery, (snap) => {
          setData((prev) => ({
            ...prev,
            attendance: snap.docs.map((d) => ({ ...d.data(), id: d.id } as AttendanceRecord)),
          }));
        })
      );
    }

    // ── Gallery — everyone (school event photos, not sensitive) ──────────────
    unsubs.push(
      onSnapshot(
        query(collection(db, "gallery"), orderBy("uploadedAt", "desc")),
        (snap) => {
          setData((prev) => ({
            ...prev,
            gallery: snap.docs.map((d) => ({ ...d.data(), id: d.id } as GalleryItem)),
          }));
        }
      )
    );

    // ── Evaluations — STAFF ONLY (teacher performance data, highly sensitive) ─
    if (isAdmin || isTeacher) {
      unsubs.push(
        onSnapshot(collection(db, "evaluations"), (snap) => {
          setData((prev) => ({
            ...prev,
            evaluations: snap.docs.map((d) => ({ ...d.data(), id: d.id } as Evaluation)),
          }));
        })
      );
    }

    // ── Fees — ROLE FILTERED (financial data, highly sensitive) ──────────────
    // Admin  : all fee records (needed for school-wide fee management)
    // Parent : only their own child's fee record (matched by parentEmail)
    // Teacher: no access — teachers do not manage fees
    if (isAdmin) {
      unsubs.push(
        onSnapshot(collection(db, "fees"), (snap) => {
          setData((prev) => ({
            ...prev,
            fees: snap.docs.map((d) => ({ ...d.data(), id: d.id } as FeeRecord)),
          }));
        })
      );
    } else if (isParentOrStudent && user.email) {
      unsubs.push(
        onSnapshot(
          query(collection(db, "fees"), where("parentEmail", "==", user.email)),
          (snap) => {
            setData((prev) => ({
              ...prev,
              fees: snap.docs.map((d) => ({ ...d.data(), id: d.id } as FeeRecord)),
            }));
          }
        )
      );
    }

    return () => {
      clearTimeout(fallback);
      unsubs.forEach((fn) => fn());
    };
  }, [user?.uid, authLoading]);

  const completeSetup = async (_name: string, _email: string, _phone: string) => {};

  const addStaff = async (
    s: Omit<StaffMember, "id" | "isActive">,
    password?: string
  ): Promise<StaffMember> => {
    let id: string;
    if (password && s.email) {
      id = await createFirebaseAccount(s.email, password, {
        name: s.name, email: s.email, role: "teacher",
        classSection: s.classSection, department: s.department,
        phone: s.phone, rollNo: s.employeeId, parentName: "",
      });
    } else {
      id = `staff_${genId()}`;
    }
    const member: StaffMember = { ...s, id, isActive: true };
    await setDoc(doc(db, "staff", id), member);
    return member;
  };

  const updateStaff = async (id: string, updates: Partial<StaffMember>) => {
    await updateDoc(doc(db, "staff", id), updates as Record<string, unknown>);
  };

  const removeStaff = async (id: string) => {
    const member = data.staff.find((s) => s.id === id);
    if (member && PROTECTED_ADMIN_EMAILS.has(member.email.toLowerCase())) {
      throw new Error("This account is protected and cannot be removed.");
    }
    await updateDoc(doc(db, "staff", id), { isActive: false });
  };

  const addStudent = async (
    s: Omit<Student, "id">,
    password?: string
  ): Promise<Student> => {
    const id = `stu_${genId()}`;
    let parentUid: string | undefined;
    if (password && s.parentEmail) {
      parentUid = await createFirebaseAccount(s.parentEmail, password, {
        name: s.name, email: s.parentEmail, role: "parent",
        classSection: s.classSection, rollNo: s.admissionNo,
        parentName: s.parentName, phone: s.parentPhone, department: "",
      });
    }
    const student: Student = { ...s, id, ...(parentUid ? { parentUid } : {}) };
    await setDoc(doc(db, "students", id), student);
    // Auto-create fee record for the student
    await setDoc(doc(db, "fees", id), makeFeeRecord(student));
    return student;
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    await updateDoc(doc(db, "students", id), updates as Record<string, unknown>);
  };

  const removeStudent = async (id: string) => {
    // Delegates to the Express API for cascade deletion across both databases:
    //   Postgres  — point_log, repeat_winner_guard, fees rows
    //   Firestore — students/{id}  and  fees/{id}  (batch delete via Admin SDK)
    // Direct Firestore deleteDoc is intentionally not used here; the Firestore
    // security rules block client-side deletion of student documents.
    const { auth: firebaseAuth } = await import("@/lib/firebase");
    const token = await firebaseAuth.currentUser?.getIdToken();
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_URL}/api/students/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = (await res.json()) as { message?: string };
      throw new Error(body.message ?? "Failed to delete student");
    }
  };

  const getAttendanceForDate = (date: string, classSection: string) =>
    data.attendance.find((a) => a.date === date && a.classSection === classSection);

  const markAttendance = async (rec: Omit<AttendanceRecord, "id">) => {
    const existing = getAttendanceForDate(rec.date, rec.classSection);
    if (existing) {
      await updateDoc(doc(db, "attendance", existing.id), {
        records: rec.records,
        teacherId: rec.teacherId,
      });
    } else {
      const id = `att_${genId()}`;
      await setDoc(doc(db, "attendance", id), { ...rec, id });
    }
  };

  const addHomework = async (hw: Omit<HomeworkEntry, "id" | "postedAt">): Promise<HomeworkEntry> => {
    const id = `hw_${genId()}`;
    const entry: HomeworkEntry = { ...hw, id, postedAt: new Date().toISOString() };
    await setDoc(doc(db, "homework", id), entry);
    return entry;
  };

  const addEvaluation = async (ev: Omit<Evaluation, "id">) => {
    const id = `eval_${genId()}`;
    await setDoc(doc(db, "evaluations", id), { ...ev, id });
  };

  const updateEvaluation = async (id: string, updates: Partial<Evaluation>) => {
    await updateDoc(doc(db, "evaluations", id), updates as Record<string, unknown>);
  };

  const updateSettings = async (s: Partial<AppSettings>) => {
    await updateDoc(doc(db, "settings", "main"), s as Record<string, unknown>);
  };

  // ── Fee management ────────────────────────────────────────────────────────
  const initStudentFee = async (student: Student) => {
    const existing = data.fees.find((f) => f.studentId === student.id);
    if (existing) return;
    await setDoc(doc(db, "fees", student.id), makeFeeRecord(student));
  };

  const recordFeePayment = async (studentId: string, amount: number, note: string, recordedBy: string) => {
    const rec = data.fees.find((f) => f.studentId === studentId);
    if (!rec) return;
    const entry: PaymentEntry = { id: `pay_${genId()}`, amount, date: new Date().toISOString().split("T")[0], note, recordedBy };
    const paidAmount = rec.paidAmount + amount;
    const totals = recomputeTotals({ ...rec, paidAmount });
    await updateDoc(doc(db, "fees", studentId), {
      payments: arrayUnion(entry),
      paidAmount,
      ...totals,
      lastUpdated: new Date().toISOString(),
    });
  };

  const setStudentBusFee = async (studentId: string, amount: number) => {
    const rec = data.fees.find((f) => f.studentId === studentId);
    if (!rec) return;
    const totals = recomputeTotals({ ...rec, busFee: amount });
    await updateDoc(doc(db, "fees", studentId), { busFee: amount, ...totals, lastUpdated: new Date().toISOString() });
  };

  const addStudentOtherFee = async (studentId: string, label: string, amount: number) => {
    const rec = data.fees.find((f) => f.studentId === studentId);
    if (!rec) return;
    const item: OtherFeeItem = { id: genId(), label, amount };
    const otherFees = [...rec.otherFees, item];
    const totals = recomputeTotals({ ...rec, otherFees });
    await updateDoc(doc(db, "fees", studentId), { otherFees, ...totals, lastUpdated: new Date().toISOString() });
  };

  const removeStudentOtherFee = async (studentId: string, feeItemId: string) => {
    const rec = data.fees.find((f) => f.studentId === studentId);
    if (!rec) return;
    const otherFees = rec.otherFees.filter((f) => f.id !== feeItemId);
    const totals = recomputeTotals({ ...rec, otherFees });
    await updateDoc(doc(db, "fees", studentId), { otherFees, ...totals, lastUpdated: new Date().toISOString() });
  };

  const updateTimetable = async (day: string, slots: TimetableSlot[]) => {
    const updated = data.timetable.map((d) => (d.day === day ? { ...d, slots } : d));
    await updateDoc(doc(db, "settings", "main"), { timetable: updated });
  };

  /**
   * @deprecated Use useMarkNoticeReadLocally() from hooks/useNotices.ts instead.
   * Kept here to avoid breaking any callers that haven't been migrated yet.
   */
  const markNoticeRead = async (id: string) => {
    readIds.current.add(id);
    AsyncStorage.setItem(READ_NOTICES_KEY, JSON.stringify([...readIds.current]));
    // Note: no longer updates data.notices since notices were removed from AppData.
    // The React Query cache update is handled by useMarkNoticeReadLocally().
  };

  const markParentFirstLogin = async (email: string) => {
    if (!data.firstLoginParents.includes(email)) {
      await updateDoc(doc(db, "settings", "main"), {
        firstLoginParents: arrayUnion(email),
      });
    }
  };

  const addGalleryPhoto = async (item: Omit<GalleryItem, "id" | "uploadedAt">) => {
    const id = `gal_${genId()}`;
    const entry: GalleryItem = { ...item, id, uploadedAt: new Date().toISOString() };
    await setDoc(doc(db, "gallery", id), entry);
  };

  const removeGalleryPhoto = async (id: string) => {
    await deleteDoc(doc(db, "gallery", id));
  };

  return (
    <DataContext.Provider
      value={{
        data, isLoading, completeSetup,
        addStaff, updateStaff, removeStaff,
        addStudent, updateStudent, removeStudent,
        markAttendance, getAttendanceForDate,
        addHomework, addEvaluation, updateEvaluation,
        updateSettings, updateTimetable,
        markNoticeRead, markParentFirstLogin,
        addGalleryPhoto, removeGalleryPhoto,
        initStudentFee, recordFeePayment,
        setStudentBusFee, addStudentOtherFee, removeStudentOtherFee,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
