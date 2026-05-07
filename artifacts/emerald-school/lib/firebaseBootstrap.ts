import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  setDoc,
} from "firebase/firestore";
import { auth, db, firebaseConfig } from "./firebase";

const BOOTSTRAP_KEY = "@emerald_bootstrapped_v4";

const ADMIN_ACCOUNTS = [
  { email: "ashiquemuhammed057@gmail.com", password: "Emeraldismkd@1234", name: "Ashique Mohammed" },
  { email: "emeraldinternationalschoolmkd@gmail.com", password: "Emeraldismkd@1234", name: "Emerald Admin" },
  { email: "shiyasrgz@gmail.com", password: "Emeraldismkd@1234", name: "Shiyas" },
];

export async function createFirebaseAccount(
  email: string,
  password: string,
  userData: Record<string, unknown>
): Promise<string> {
  const tempApp = initializeApp(firebaseConfig, `temp_${Date.now()}`);
  const tempAuth = getAuth(tempApp);
  try {
    const cred = await createUserWithEmailAndPassword(tempAuth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), { uid: cred.user.uid, ...userData });
    return cred.user.uid;
  } finally {
    try { await signOut(tempAuth); } catch {}
    try { await deleteApp(tempApp); } catch {}
  }
}

async function ensureAdminProfile(uid: string, name: string, email: string) {
  await setDoc(
    doc(db, "users", uid),
    { uid, name, email, role: "admin", classSection: "", department: "", phone: "", rollNo: "", parentName: "" },
    { merge: true }
  );
}

async function createViaSecondaryApp(
  email: string,
  password: string,
  userData: Record<string, unknown>
): Promise<void> {
  try {
    await createFirebaseAccount(email, password, userData);
  } catch (e: any) {
    if (e.code !== "auth/email-already-in-use") {
      console.warn("Bootstrap create account:", e.message);
    }
  }
}

export async function bootstrapApp(): Promise<void> {
  const done = await AsyncStorage.getItem(BOOTSTRAP_KEY);
  if (done === "true") return;

  let authenticated = false;

  for (const admin of ADMIN_ACCOUNTS) {
    try {
      const cred = await signInWithEmailAndPassword(auth, admin.email, admin.password);
      await ensureAdminProfile(cred.user.uid, admin.name, admin.email);
      authenticated = true;
      break;
    } catch (e: any) {
      const isNotFound =
        e.code === "auth/user-not-found" ||
        e.code === "auth/invalid-credential" ||
        e.code === "auth/invalid-login-credentials";
      if (isNotFound) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, admin.email, admin.password);
          await ensureAdminProfile(cred.user.uid, admin.name, admin.email);
          authenticated = true;
          break;
        } catch (ce: any) {
          if (ce.code === "auth/email-already-in-use") continue;
        }
      }
    }
  }

  if (!authenticated) {
    console.warn("Bootstrap: unable to authenticate");
    return;
  }

  const currentEmail = auth.currentUser?.email ?? "";

  for (const admin of ADMIN_ACCOUNTS) {
    if (admin.email === currentEmail) continue;
    await createViaSecondaryApp(admin.email, admin.password, {
      name: admin.name, email: admin.email, role: "admin",
      classSection: "", department: "", phone: "", rollNo: "", parentName: "",
    });
  }

  await createViaSecondaryApp("teacher@emerald.edu", "demo123", {
    name: "Mr. Rajan Krishnan", email: "teacher@emerald.edu", role: "teacher",
    classSection: "X-B", department: "Mathematics", phone: "+91 98765 11001",
    rollNo: "EIS/TCH/018", parentName: "",
  });

  await createViaSecondaryApp("parent@emerald.edu", "demo123", {
    name: "Aryan Sharma", email: "parent@emerald.edu", role: "parent",
    classSection: "X-B", rollNo: "EIS/2024/1024", parentName: "Rajesh Sharma",
    phone: "+91 98765 43210", department: "",
  });

  const staffSnap = await getDocs(query(collection(db, "staff"), limit(1)));
  if (staffSnap.empty) {
    await seedFirestoreData();
  }

  await signOut(auth);
  await AsyncStorage.setItem(BOOTSTRAP_KEY, "true");
}

async function seedFirestoreData() {
  const timetable = [
    { day: "Monday", slots: [{ time: "8:00", subject: "Mathematics", teacher: "Mr. Rajan Krishnan" }, { time: "9:00", subject: "Physics", teacher: "Ms. Priya Menon" }, { time: "10:00", subject: "English", teacher: "Ms. Anita George" }, { time: "11:15", subject: "Chemistry", teacher: "Mr. Suresh Kumar" }, { time: "1:30", subject: "Biology", teacher: "Ms. Lakshmi Nair" }, { time: "2:30", subject: "Computer Science", teacher: "Mr. Vinod Thomas" }] },
    { day: "Tuesday", slots: [{ time: "8:00", subject: "English", teacher: "Ms. Anita George" }, { time: "9:00", subject: "Mathematics", teacher: "Mr. Rajan Krishnan" }, { time: "10:00", subject: "Computer Science", teacher: "Mr. Vinod Thomas" }, { time: "11:15", subject: "Physics", teacher: "Ms. Priya Menon" }, { time: "1:30", subject: "Chemistry", teacher: "Mr. Suresh Kumar" }, { time: "2:30", subject: "Biology", teacher: "Ms. Lakshmi Nair" }] },
    { day: "Wednesday", slots: [{ time: "8:00", subject: "Biology", teacher: "Ms. Lakshmi Nair" }, { time: "9:00", subject: "English", teacher: "Ms. Anita George" }, { time: "10:00", subject: "Mathematics", teacher: "Mr. Rajan Krishnan" }, { time: "11:15", subject: "Computer Science", teacher: "Mr. Vinod Thomas" }, { time: "1:30", subject: "Physics", teacher: "Ms. Priya Menon" }, { time: "2:30", subject: "Chemistry", teacher: "Mr. Suresh Kumar" }] },
    { day: "Thursday", slots: [{ time: "8:00", subject: "Chemistry", teacher: "Mr. Suresh Kumar" }, { time: "9:00", subject: "Biology", teacher: "Ms. Lakshmi Nair" }, { time: "10:00", subject: "Physics", teacher: "Ms. Priya Menon" }, { time: "11:15", subject: "English", teacher: "Ms. Anita George" }, { time: "1:30", subject: "Mathematics", teacher: "Mr. Rajan Krishnan" }, { time: "2:30", subject: "Computer Science", teacher: "Mr. Vinod Thomas" }] },
    { day: "Friday", slots: [{ time: "8:00", subject: "Computer Science", teacher: "Mr. Vinod Thomas" }, { time: "9:00", subject: "Chemistry", teacher: "Mr. Suresh Kumar" }, { time: "10:00", subject: "Biology", teacher: "Ms. Lakshmi Nair" }, { time: "11:15", subject: "Mathematics", teacher: "Mr. Rajan Krishnan" }, { time: "1:30", subject: "English", teacher: "Ms. Anita George" }, { time: "2:30", subject: "Physics", teacher: "Ms. Priya Menon" }] },
    { day: "Saturday", slots: [{ time: "8:00", subject: "Mathematics", teacher: "Mr. Rajan Krishnan" }, { time: "9:00", subject: "Computer Science", teacher: "Mr. Vinod Thomas" }] },
  ];

  await setDoc(doc(db, "settings", "main"), {
    schoolName: "Emerald International School",
    address: "Vadakkumannam, Mannarkkad, Palakkad, Kerala",
    phone: "+91 6238960292, +91 7356596745",
    email: "emeraldinternationalschoolmkd@gmail.com",
    principalName: "Shalima Soman",
    academicYear: "2025-26",
    firstLoginParents: [],
    timetable,
  });

  const staff = [
    { id: "staff_001", name: "Mr. Rajan Krishnan", phone: "+91 98765 11001", email: "rajan@emerald.edu", role: "Class Teacher", department: "Mathematics", classSection: "X-B", joinDate: "2018-06-01", employeeId: "EIS/TCH/018", isActive: true },
    { id: "staff_002", name: "Ms. Priya Menon", phone: "+91 98765 11002", email: "priya@emerald.edu", role: "Subject Teacher", department: "Physics", classSection: "X-B", joinDate: "2020-06-01", employeeId: "EIS/TCH/020", isActive: true },
    { id: "staff_003", name: "Ms. Anita George", phone: "+91 98765 11003", email: "anita@emerald.edu", role: "Subject Teacher", department: "English", classSection: "X-B", joinDate: "2019-06-01", employeeId: "EIS/TCH/019", isActive: true },
    { id: "staff_004", name: "Mr. Suresh Kumar", phone: "+91 98765 11004", email: "suresh@emerald.edu", role: "Subject Teacher", department: "Chemistry", classSection: "X-B", joinDate: "2021-06-01", employeeId: "EIS/TCH/021", isActive: true },
    { id: "staff_005", name: "Ms. Lakshmi Nair", phone: "+91 98765 11005", email: "nair@emerald.edu", role: "Subject Teacher", department: "Biology", classSection: "X-B", joinDate: "2017-06-01", employeeId: "EIS/TCH/017", isActive: true },
    { id: "staff_006", name: "Mr. Vinod Thomas", phone: "+91 98765 11006", email: "vinod@emerald.edu", role: "Subject Teacher", department: "Computer Science", classSection: "X-B", joinDate: "2022-06-01", employeeId: "EIS/TCH/022", isActive: true },
    { id: "staff_007", name: "Ms. Sheela Varma", phone: "+91 98765 11007", email: "sheela@emerald.edu", role: "Office Staff", department: "Office", classSection: "", joinDate: "2015-06-01", employeeId: "EIS/OFF/015", isActive: true },
  ];
  for (const s of staff) await setDoc(doc(db, "staff", s.id), s);

  const students = [
    { id: "stu_001", name: "Aryan Sharma", dob: "2009-03-12", gender: "Male", bloodGroup: "A+", classSection: "X-B", rollNo: "1", admissionNo: "EIS/2024/1024", parentName: "Rajesh Sharma", parentPhone: "+91 98765 43210", parentEmail: "parent@emerald.edu", parentWhatsApp: "+91 98765 43210", address: "12, Gandhi Nagar, Mannarkkad", prevSchool: "St. Mary's School" },
    { id: "stu_002", name: "Meera Pillai", dob: "2009-07-22", gender: "Female", bloodGroup: "B+", classSection: "X-B", rollNo: "2", admissionNo: "EIS/2024/1025", parentName: "Suresh Pillai", parentPhone: "+91 98765 43211", parentEmail: "meera.parent@example.com", parentWhatsApp: "+91 98765 43211", address: "45, MG Road, Mannarkkad", prevSchool: "" },
    { id: "stu_003", name: "Aditya Nair", dob: "2009-11-05", gender: "Male", bloodGroup: "O+", classSection: "X-B", rollNo: "3", admissionNo: "EIS/2024/1026", parentName: "Vijay Nair", parentPhone: "+91 98765 43212", parentEmail: "aditya.parent@example.com", parentWhatsApp: "+91 98765 43212", address: "78, Nehru Street, Palakkad", prevSchool: "Central School" },
    { id: "stu_004", name: "Priya Thomas", dob: "2009-02-18", gender: "Female", bloodGroup: "AB+", classSection: "X-B", rollNo: "4", admissionNo: "EIS/2024/1027", parentName: "George Thomas", parentPhone: "+91 98765 43213", parentEmail: "priya.parent@example.com", parentWhatsApp: "+91 98765 43213", address: "22, Church Road, Mannarkkad", prevSchool: "" },
    { id: "stu_005", name: "Rahul Menon", dob: "2009-09-30", gender: "Male", bloodGroup: "B-", classSection: "X-B", rollNo: "5", admissionNo: "EIS/2024/1028", parentName: "Ravi Menon", parentPhone: "+91 98765 43214", parentEmail: "rahul.parent@example.com", parentWhatsApp: "+91 98765 43214", address: "56, Lake View, Mannarkkad", prevSchool: "Kendriya Vidyalaya" },
  ];
  for (const s of students) await setDoc(doc(db, "students", s.id), s);

  const notices = [
    { id: "n1", title: "Fee Payment Reminder — Q3", body: "Last date for fee payment is 20th January. Late payments attract a penalty of ₹200.", category: "Fees", time: "Today · 9:12 AM", postedAt: "2025-01-15T09:12:00Z", isRead: false, targetRole: "all" },
    { id: "n2", title: "Tarang 2025 — Annual Day", body: "Rehearsals start Monday. Costume list shared separately.", category: "Events", time: "Yesterday · 4:30 PM", postedAt: "2025-01-14T16:30:00Z", isRead: false, targetRole: "all" },
    { id: "n3", title: "NEET Foundation — New Batch", body: "New NEET foundation batch begins for Class X students. Register by Friday.", category: "Academic", time: "Jan 10 · 11:00 AM", postedAt: "2025-01-10T11:00:00Z", isRead: false, targetRole: "student" },
    { id: "n4", title: "Holiday — Pongal", body: "School closed on 14th and 15th January. Classes resume 16th.", category: "General", time: "Jan 9 · 8:00 AM", postedAt: "2025-01-09T08:00:00Z", isRead: true, targetRole: "all" },
    { id: "n5", title: "Inter-School Football Tournament", body: "Our team plays on 18th Jan. Buses from school at 9 AM.", category: "Sports", time: "Jan 8 · 3:00 PM", postedAt: "2025-01-08T15:00:00Z", isRead: true, targetRole: "all" },
  ];
  for (const n of notices) await setDoc(doc(db, "notices", n.id), n);

  const homework = [
    { id: "ehw_001", teacherId: "staff_001", teacherName: "Mr. Rajan Krishnan", subject: "Mathematics", classSection: "X-B", title: "Exercise 5.3 — Quadratic Equations", description: "Complete problems 1 to 15 from page 98. Show full working.", dueDate: "2025-01-20", postedAt: "2025-01-15T10:00:00Z" },
    { id: "ehw_002", teacherId: "staff_002", teacherName: "Ms. Priya Menon", subject: "Physics", classSection: "X-B", title: "Lab Report — Ohm's Law", description: "Write the complete lab report with observations and conclusions.", dueDate: "2025-01-22", postedAt: "2025-01-15T11:00:00Z" },
    { id: "ehw_003", teacherId: "staff_003", teacherName: "Ms. Anita George", subject: "English", classSection: "X-B", title: "Essay — My Favourite Festival", description: "Write a 300-word essay. Focus on descriptive language.", dueDate: "2025-01-27", postedAt: "2025-01-14T09:00:00Z" },
  ];
  for (const h of homework) await setDoc(doc(db, "homework", h.id), h);

  await setDoc(doc(db, "evaluations", "eval_001"), {
    id: "eval_001", teacherId: "staff_001", teacherName: "Mr. Rajan Krishnan",
    subject: "Mathematics", classSection: "X-B",
    ratings: { teachingQuality: 5, classroomManagement: 4, studentEngagement: 5, punctuality: 5, parentCommunication: 4, homeworkManagement: 4 },
    strengths: "Excellent command over the subject.",
    improvements: "Could improve parent communication.",
    remarks: "One of our best teachers.", overallRating: 5, date: "2024-11-15",
  });
}
