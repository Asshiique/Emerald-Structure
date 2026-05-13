/**
 * seed-firestore.ts
 *
 * Seeds the Firestore database for Emerald International School.
 * Uses the Firebase CLIENT SDK (no service account needed) with
 * the same config as the app itself.
 *
 * What it does:
 *  1. Connects to Firestore
 *  2. Creates admin user profiles in the `users` collection
 *  3. Creates app settings with a FULL 5-day timetable
 *  4. Creates sample notices, staff, students, homework, gallery, evaluations
 *
 * Run: node --import tsx/esm scripts/src/seed-firestore.ts
 *
 * NOTE: This script creates Firebase Auth accounts for the 3 admins
 *       using createUserWithEmailAndPassword if they don't exist yet.
 *       It does NOT require a service account.
 */

import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// ─── Firebase config (same as the app) ───────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAgTP4Z6hp6sDfScxC5SDLEJTtMLvHBRPg",
  authDomain: "emerald-app-da985.firebaseapp.com",
  projectId: "emerald-app-da985",
  storageBucket: "emerald-app-da985.firebasestorage.app",
  messagingSenderId: "799787181926",
  appId: "1:799787181926:web:473ab1dce9ea158f144aa7",
};

const ADMIN_ACCOUNTS = [
  { email: "ashiquemuhammed057@gmail.com",           password: "Emeraldismkd@1234", name: "Ashique Mohammed" },
  { email: "emeraldinternationalschoolmkd@gmail.com", password: "Emeraldismkd@1234", name: "Emerald Admin" },
  { email: "shiyasrgz@gmail.com",                    password: "Emeraldismkd@1234", name: "Shiyas" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function log(msg: string)  { console.log(`  ${msg}`); }
function ok(msg: string)   { console.log(`  ✅ ${msg}`); }
function warn(msg: string) { console.log(`  ⚠️  ${msg}`); }
function info(msg: string) { console.log(`\n📋 ${msg}`); }

// ─── Main ─────────────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

async function checkCollection(name: string): Promise<number> {
  const snap = await getDocs(collection(db, name));
  return snap.size;
}

async function ensureAdminAuth(email: string, password: string, name: string): Promise<string | null> {
  // Try signing in first
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await signOut(auth);
    return cred.user.uid;
  } catch (e: any) {
    if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential" || e.code === "auth/invalid-login-credentials") {
      // Account doesn't exist — create it using a temp app so we don't disturb main auth state
      try {
        const tempApp  = initializeApp(firebaseConfig, `temp_seed_${Date.now()}`);
        const tempAuth = getAuth(tempApp);
        const cred = await createUserWithEmailAndPassword(tempAuth, email, password);
        const uid = cred.user.uid;
        await signOut(tempAuth);
        await deleteApp(tempApp);
        return uid;
      } catch (ce: any) {
        if (ce.code === "auth/email-already-in-use") {
          warn(`${email} already exists in Auth but password mismatch — skipping Auth create`);
          return null;
        }
        warn(`Could not create Auth account for ${email}: ${ce.message}`);
        return null;
      }
    }
    if (e.code === "auth/wrong-password") {
      warn(`${email} exists in Auth but password is different from seed default. Skipping.`);
      return null;
    }
    warn(`Auth check failed for ${email}: ${e.message}`);
    return null;
  }
}

// ─── Step 1: Admin profiles ───────────────────────────────────────────────────
async function seedAdminProfiles() {
  info("Step 1 — Seeding admin Firebase Auth accounts + Firestore profiles");

  for (const admin of ADMIN_ACCOUNTS) {
    log(`Processing ${admin.email}…`);

    const uid = await ensureAdminAuth(admin.email, admin.password, admin.name);

    if (uid) {
      const ref = doc(db, "users", uid);
      const existing = await getDoc(ref);
      if (!existing.exists()) {
        await setDoc(ref, {
          uid,
          name: admin.name,
          email: admin.email,
          role: "admin",
          classSection: "",
          department: "",
          phone: "",
          rollNo: "",
          parentName: "",
          hasSeenWelcome: true,
        });
        ok(`Created Firestore profile for ${admin.email} (uid: ${uid})`);
      } else {
        // Ensure role is admin even if doc existed
        await setDoc(ref, { role: "admin", hasSeenWelcome: true }, { merge: true });
        ok(`Profile already exists for ${admin.email} — ensured role=admin`);
      }
    } else {
      warn(`Skipping Firestore write for ${admin.email} (no UID obtained)`);
    }
  }
}

// ─── Step 2: App settings + full 5-day timetable ─────────────────────────────
async function seedSettings() {
  info("Step 2 — Seeding app settings (with full Mon–Fri timetable)");

  const ref = doc(db, "settings", "main");
  const existing = await getDoc(ref);
  if (existing.exists()) {
    // Merge updated timetable in case only Mon-Tue was seeded previously
    const data = existing.data();
    const timetableLen: number = Array.isArray(data?.timetable) ? data.timetable.length : 0;
    if (timetableLen >= 5) {
      ok("settings/main already exists with full timetable — skipping");
      return;
    }
    warn("settings/main exists but has incomplete timetable — patching with full Mon–Fri schedule");
  }

  await setDoc(ref, {
    schoolName: "Emerald International School",
    address: "Vadakkumannam, Mannarkkad, Palakkad, Kerala",
    phone: "+91 6238960292, +91 7356596745",
    email: "emeraldinternationalschoolmkd@gmail.com",
    principalName: "Shalima Soman",
    academicYear: "2025-26",
    firstLoginParents: [],
    timetable: [
      {
        day: "Monday",
        slots: [
          { time: "8:30 – 9:10",   subject: "Mathematics",        teacher: "Mr. Krishnan" },
          { time: "9:10 – 9:50",   subject: "English",            teacher: "Ms. Anitha" },
          { time: "10:10 – 10:50", subject: "Science",            teacher: "Mr. Rajan" },
          { time: "10:50 – 11:30", subject: "Social Studies",     teacher: "Ms. Devi" },
          { time: "11:30 – 12:10", subject: "Malayalam",          teacher: "Mr. Suresh" },
          { time: "1:00 – 1:40",   subject: "Physical Education", teacher: "Mr. Thomas" },
          { time: "1:40 – 2:20",   subject: "Computer Science",   teacher: "Ms. Nisha" },
        ],
      },
      {
        day: "Tuesday",
        slots: [
          { time: "8:30 – 9:10",   subject: "English",        teacher: "Ms. Anitha" },
          { time: "9:10 – 9:50",   subject: "Mathematics",    teacher: "Mr. Krishnan" },
          { time: "10:10 – 10:50", subject: "Malayalam",      teacher: "Mr. Suresh" },
          { time: "10:50 – 11:30", subject: "Science",        teacher: "Mr. Rajan" },
          { time: "11:30 – 12:10", subject: "Art & Craft",    teacher: "Ms. Meena" },
          { time: "1:00 – 1:40",   subject: "Social Studies", teacher: "Ms. Devi" },
          { time: "1:40 – 2:20",   subject: "Mathematics",    teacher: "Mr. Krishnan" },
        ],
      },
      {
        day: "Wednesday",
        slots: [
          { time: "8:30 – 9:10",   subject: "Science",            teacher: "Mr. Rajan" },
          { time: "9:10 – 9:50",   subject: "Social Studies",     teacher: "Ms. Devi" },
          { time: "10:10 – 10:50", subject: "English",            teacher: "Ms. Anitha" },
          { time: "10:50 – 11:30", subject: "Computer Science",   teacher: "Ms. Nisha" },
          { time: "11:30 – 12:10", subject: "Mathematics",        teacher: "Mr. Krishnan" },
          { time: "1:00 – 1:40",   subject: "Malayalam",          teacher: "Mr. Suresh" },
          { time: "1:40 – 2:20",   subject: "Physical Education", teacher: "Mr. Thomas" },
        ],
      },
      {
        day: "Thursday",
        slots: [
          { time: "8:30 – 9:10",   subject: "Malayalam",      teacher: "Mr. Suresh" },
          { time: "9:10 – 9:50",   subject: "Science",        teacher: "Mr. Rajan" },
          { time: "10:10 – 10:50", subject: "Mathematics",    teacher: "Mr. Krishnan" },
          { time: "10:50 – 11:30", subject: "Art & Craft",    teacher: "Ms. Meena" },
          { time: "11:30 – 12:10", subject: "Social Studies", teacher: "Ms. Devi" },
          { time: "1:00 – 1:40",   subject: "English",        teacher: "Ms. Anitha" },
          { time: "1:40 – 2:20",   subject: "Science",        teacher: "Mr. Rajan" },
        ],
      },
      {
        day: "Friday",
        slots: [
          { time: "8:30 – 9:10",   subject: "Social Studies",     teacher: "Ms. Devi" },
          { time: "9:10 – 9:50",   subject: "English",            teacher: "Ms. Anitha" },
          { time: "10:10 – 10:50", subject: "Mathematics",        teacher: "Mr. Krishnan" },
          { time: "10:50 – 11:30", subject: "Malayalam",          teacher: "Mr. Suresh" },
          { time: "11:30 – 12:10", subject: "Computer Science",   teacher: "Ms. Nisha" },
          { time: "1:00 – 1:40",   subject: "Art & Craft",        teacher: "Ms. Meena" },
          { time: "1:40 – 2:20",   subject: "Physical Education", teacher: "Mr. Thomas" },
        ],
      },
    ],
  }, { merge: true });
  ok("settings/main created/updated with full Mon–Fri timetable");
}

// ─── Step 3: Notices ──────────────────────────────────────────────────────────
async function seedNotices() {
  info("Step 3 — Seeding sample notices in Firestore (legacy collection)");

  const count = await checkCollection("notices");
  if (count > 0) {
    ok(`notices collection already has ${count} document(s) — skipping`);
    return;
  }

  const batch = writeBatch(db);
  const now = new Date();

  const notices = [
    {
      id: "notice_001",
      title: "Welcome to Emerald International School",
      body: "We are pleased to welcome all students and parents to the new academic year 2025-26. Classes commence on 1st June 2025. Please ensure all required documents are submitted to the office by 28th May.",
      category: "General",
      targetRole: "all",
      time: "Today",
      postedAt: now.toISOString(),
      isRead: false,
    },
    {
      id: "notice_002",
      title: "Annual Fee Payment Reminder",
      body: "This is a reminder that the first-term annual fee is due on or before 15th June 2025. Late payments will attract a penalty of ₹50 per day. Please contact the accounts office for any fee-related queries.",
      category: "Fees",
      targetRole: "parent",
      time: "Yesterday",
      postedAt: new Date(now.getTime() - 86400000).toISOString(),
      isRead: false,
    },
    {
      id: "notice_003",
      title: "Parent-Teacher Meeting — Class 8 & 9",
      body: "A Parent-Teacher Meeting is scheduled for Saturday, 24th May 2025 from 9:00 AM to 12:00 PM. All parents of Class 8 and Class 9 students are requested to attend. The agenda includes progress reports and the upcoming board exam schedule.",
      category: "Events",
      targetRole: "parent",
      time: "2 days ago",
      postedAt: new Date(now.getTime() - 172800000).toISOString(),
      isRead: false,
    },
    {
      id: "notice_004",
      title: "Revised Sports Day Schedule",
      body: "Due to weather concerns, the Annual Sports Day originally scheduled for 10th May has been rescheduled to 20th May 2025. Venue remains the school ground. All participants please report by 7:30 AM in sports uniform.",
      category: "Sports",
      targetRole: "all",
      time: "3 days ago",
      postedAt: new Date(now.getTime() - 259200000).toISOString(),
      isRead: false,
    },
    {
      id: "notice_005",
      title: "Unit Test — Science & Mathematics (Class 6–10)",
      body: "Unit tests for Science and Mathematics are scheduled for the week of 26th–30th May 2025. Students must bring their own stationery. Calculators are NOT permitted. Syllabus details have been shared in each class group.",
      category: "Academic",
      targetRole: "all",
      time: "5 days ago",
      postedAt: new Date(now.getTime() - 432000000).toISOString(),
      isRead: false,
    },
  ];

  for (const notice of notices) {
    batch.set(doc(db, "notices", notice.id), notice);
  }
  await batch.commit();
  ok(`Created ${notices.length} sample notices`);
}

// ─── Step 4: Staff ────────────────────────────────────────────────────────────
async function seedStaff() {
  info("Step 4 — Seeding sample staff members");

  const count = await checkCollection("staff");
  if (count > 0) {
    ok(`staff collection already has ${count} document(s) — skipping`);
    return;
  }

  const batch = writeBatch(db);
  const joinDate = "2023-06-01";

  const staffMembers = [
    {
      id: "staff_krishnan",
      name: "Mr. Krishnan Nair",
      phone: "+91 9876543210",
      email: "krishnan.nair@emeraldschool.edu",
      role: "Subject Teacher",
      department: "Mathematics",
      classSection: "8A",
      joinDate,
      employeeId: "EMP001",
      isActive: true,
    },
    {
      id: "staff_anitha",
      name: "Ms. Anitha Pillai",
      phone: "+91 9876543211",
      email: "anitha.pillai@emeraldschool.edu",
      role: "Class Teacher",
      department: "English",
      classSection: "9B",
      joinDate,
      employeeId: "EMP002",
      isActive: true,
    },
    {
      id: "staff_rajan",
      name: "Mr. Rajan Varma",
      phone: "+91 9876543212",
      email: "rajan.varma@emeraldschool.edu",
      role: "Subject Teacher",
      department: "Science",
      classSection: "10A",
      joinDate,
      employeeId: "EMP003",
      isActive: true,
    },
    {
      id: "staff_principal",
      name: "Ms. Shalima Soman",
      phone: "+91 9876543213",
      email: "shalima.soman@emeraldschool.edu",
      role: "Principal",
      department: "Administration",
      classSection: "",
      joinDate: "2018-06-01",
      employeeId: "EMP000",
      isActive: true,
    },
  ];

  for (const s of staffMembers) {
    batch.set(doc(db, "staff", s.id), s);
  }
  await batch.commit();
  ok(`Created ${staffMembers.length} sample staff members`);
}

// ─── Step 5: Students ─────────────────────────────────────────────────────────
async function seedStudents() {
  info("Step 5 — Seeding sample students");

  const count = await checkCollection("students");
  if (count > 0) {
    ok(`students collection already has ${count} document(s) — skipping`);
    return;
  }

  const batch = writeBatch(db);

  const students = [
    {
      id: "stu_001",
      name: "Arjun Kumar",
      dob: "2012-03-15",
      gender: "Male",
      bloodGroup: "B+",
      classSection: "8A",
      rollNo: "8A001",
      admissionNo: "ADM2023001",
      parentName: "Rajesh Kumar",
      parentPhone: "+91 9876001001",
      parentEmail: "rajesh.kumar@gmail.com",
      parentWhatsApp: "+91 9876001001",
      address: "12, Mannarkkad Road, Palakkad, Kerala 678582",
      prevSchool: "St. Joseph's School, Palakkad",
    },
    {
      id: "stu_002",
      name: "Fathima Zara",
      dob: "2011-08-22",
      gender: "Female",
      bloodGroup: "O+",
      classSection: "9B",
      rollNo: "9B002",
      admissionNo: "ADM2022002",
      parentName: "Muhammed Farhan",
      parentPhone: "+91 9876001002",
      parentEmail: "m.farhan@gmail.com",
      parentWhatsApp: "+91 9876001002",
      address: "45, Vadakkumannam, Mannarkkad, Kerala 678761",
      prevSchool: "Government Higher Secondary School, Mannarkkad",
    },
    {
      id: "stu_003",
      name: "Devika Menon",
      dob: "2010-11-10",
      gender: "Female",
      bloodGroup: "A+",
      classSection: "10A",
      rollNo: "10A003",
      admissionNo: "ADM2021003",
      parentName: "Suresh Menon",
      parentPhone: "+91 9876001003",
      parentEmail: "suresh.menon@gmail.com",
      parentWhatsApp: "+91 9876001003",
      address: "78, KK Road, Mannarkkad, Kerala 678762",
      prevSchool: "Holy Family School, Mannarkkad",
    },
  ];

  for (const s of students) {
    batch.set(doc(db, "students", s.id), s);
  }
  await batch.commit();
  ok(`Created ${students.length} sample students`);
}

// ─── Step 6: Homework ─────────────────────────────────────────────────────────
async function seedHomework() {
  info("Step 6 — Seeding sample homework entries");

  const count = await checkCollection("homework");
  if (count > 0) {
    ok(`homework collection already has ${count} document(s) — skipping`);
    return;
  }

  const batch = writeBatch(db);
  const now = new Date();

  const homework = [
    {
      id: "hw_001",
      teacherId: "staff_krishnan",
      teacherName: "Mr. Krishnan Nair",
      subject: "Mathematics",
      classSection: "8A",
      title: "Chapter 3 Exercises — Algebraic Expressions",
      description: "Complete exercises 3.1 to 3.4 from the textbook. Show all working. Due Monday.",
      dueDate: new Date(now.getTime() + 3 * 86400000).toISOString().split("T")[0],
      postedAt: now.toISOString(),
    },
    {
      id: "hw_002",
      teacherId: "staff_anitha",
      teacherName: "Ms. Anitha Pillai",
      subject: "English",
      classSection: "9B",
      title: "Essay — My Favourite Season",
      description: "Write a 250-word essay on your favourite season. Use descriptive language and at least 3 literary devices.",
      dueDate: new Date(now.getTime() + 5 * 86400000).toISOString().split("T")[0],
      postedAt: new Date(now.getTime() - 86400000).toISOString(),
    },
  ];

  for (const h of homework) {
    batch.set(doc(db, "homework", h.id), h);
  }
  await batch.commit();
  ok(`Created ${homework.length} sample homework entries`);
}

// ─── Step 7: Gallery ──────────────────────────────────────────────────────────
async function seedGallery() {
  info("Step 7 — Seeding sample gallery items");

  const count = await checkCollection("gallery");
  if (count > 0) {
    ok(`gallery collection already has ${count} document(s) — skipping`);
    return;
  }

  const batch = writeBatch(db);
  const now = new Date();

  const galleryItems = [
    {
      id: "gal_001",
      title: "Annual Day 2024 — Cultural Performance",
      category: "Cultural",
      date: "2024-12-15",
      // Use a reliable placeholder image
      photo: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
      uploadedAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
    },
    {
      id: "gal_002",
      title: "Sports Day 2024 — 100m Race",
      category: "Sports",
      date: "2024-11-20",
      photo: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
      uploadedAt: new Date(now.getTime() - 60 * 86400000).toISOString(),
    },
  ];

  for (const g of galleryItems) {
    batch.set(doc(db, "gallery", g.id), g);
  }
  await batch.commit();
  ok(`Created ${galleryItems.length} sample gallery items`);
}

// ─── Step 8: Evaluations ──────────────────────────────────────────────────────
async function seedEvaluations() {
  info("Step 8 — Seeding sample teacher evaluations");

  const count = await checkCollection("evaluations");
  if (count > 0) {
    ok(`evaluations collection already has ${count} document(s) — skipping`);
    return;
  }

  const batch = writeBatch(db);

  const evaluations = [
    {
      id: "eval_001",
      teacherId: "staff_krishnan",
      teacherName: "Mr. Krishnan Nair",
      subject: "Mathematics",
      classSection: "8A",
      ratings: {
        teachingQuality: 4,
        classroomManagement: 5,
        studentEngagement: 4,
        punctuality: 5,
        parentCommunication: 4,
        homeworkManagement: 4,
      },
      strengths: "Excellent command of subject matter, clear explanations, patient with students.",
      improvements: "Could incorporate more interactive activities to boost engagement.",
      remarks: "Overall a strong performer. Recommended for subject coordinator role.",
      overallRating: 4.3,
      date: new Date().toISOString().split("T")[0],
    },
  ];

  for (const e of evaluations) {
    batch.set(doc(db, "evaluations", e.id), e);
  }
  await batch.commit();
  ok(`Created ${evaluations.length} sample evaluations`);
}

// ─── Summary ─────────────────────────────────────────────────────────────────
async function printSummary() {
  info("Final Summary — Firestore collection document counts");
  const collections = ["users", "settings", "notices", "staff", "students", "attendance", "homework", "gallery", "evaluations"];
  for (const name of collections) {
    const count = await checkCollection(name);
    const status = count > 0 ? `${count} doc(s)` : "empty";
    log(`${name.padEnd(14)} → ${status}`);
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌱 Emerald School — Firestore Seed Script");
  console.log("━".repeat(50));
  console.log(`  Project: emerald-app-da985`);
  console.log("━".repeat(50));

  try {
    await seedAdminProfiles();
    await seedSettings();
    await seedNotices();
    await seedStaff();
    await seedStudents();
    await seedHomework();
    await seedGallery();
    await seedEvaluations();
    await printSummary();

    console.log("\n✅ Seed complete!\n");
    console.log("  Admin login credentials:");
    for (const a of ADMIN_ACCOUNTS) {
      console.log(`    📧 ${a.email}`);
      console.log(`    🔑 ${a.password}\n`);
    }
  } catch (err: any) {
    console.error("\n❌ Seed failed:", err.message ?? err);
    console.error(err);
  } finally {
    await deleteApp(app);
    process.exit(0);
  }
}

main();
