/**
 * seed-firestore.ts
 *
 * Seeds the Firestore database for Emerald International School.
 * Uses the Firebase CLIENT SDK (no service account needed) with
 * the same config as the app itself.
 *
 * What it does:
 *  1. Connects to Firestore
 *  2. Checks existing collections
 *  3. Creates admin user profiles in the `users` collection
 *  4. Creates sample notices, settings, and a timetable
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
function log(msg: string) { console.log(`  ${msg}`); }
function ok(msg: string)  { console.log(`  ✅ ${msg}`); }
function warn(msg: string){ console.log(`  ⚠️  ${msg}`); }
function info(msg: string){ console.log(`\n📋 ${msg}`); }

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
      warn(`${email} exists in Auth but password is different from seed default. Skipping (will still write Firestore profile if UID is known).`);
      return null;
    }
    warn(`Auth check failed for ${email}: ${e.message}`);
    return null;
  }
}

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

async function seedSettings() {
  info("Step 2 — Seeding app settings");

  const ref = doc(db, "settings", "main");
  const existing = await getDoc(ref);
  if (existing.exists()) {
    ok("settings/main already exists — skipping");
    return;
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
          { time: "8:30 – 9:10",  subject: "Mathematics",        teacher: "Mr. Krishnan" },
          { time: "9:10 – 9:50",  subject: "English",            teacher: "Ms. Anitha" },
          { time: "10:10 – 10:50",subject: "Science",            teacher: "Mr. Rajan" },
          { time: "10:50 – 11:30",subject: "Social Studies",     teacher: "Ms. Devi" },
          { time: "11:30 – 12:10",subject: "Malayalam",          teacher: "Mr. Suresh" },
          { time: "1:00 – 1:40",  subject: "Physical Education", teacher: "Mr. Thomas" },
          { time: "1:40 – 2:20",  subject: "Computer Science",   teacher: "Ms. Nisha" },
        ],
      },
      {
        day: "Tuesday",
        slots: [
          { time: "8:30 – 9:10",  subject: "English",       teacher: "Ms. Anitha" },
          { time: "9:10 – 9:50",  subject: "Mathematics",   teacher: "Mr. Krishnan" },
          { time: "10:10 – 10:50",subject: "Malayalam",     teacher: "Mr. Suresh" },
          { time: "10:50 – 11:30",subject: "Science",       teacher: "Mr. Rajan" },
          { time: "11:30 – 12:10",subject: "Art & Craft",   teacher: "Ms. Meena" },
          { time: "1:00 – 1:40",  subject: "Social Studies",teacher: "Ms. Devi" },
          { time: "1:40 – 2:20",  subject: "Mathematics",   teacher: "Mr. Krishnan" },
        ],
      },
    ],
  });
  ok("settings/main created");
}

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

async function printSummary() {
  info("Final Summary — Firestore collection document counts");
  const collections = ["users", "settings", "notices", "staff", "students", "attendance", "homework", "gallery", "evaluations"];
  for (const name of collections) {
    const count = await checkCollection(name);
    const status = count > 0 ? `${count} doc(s)` : "empty";
    log(`${name.padEnd(14)} → ${status}`);
  }
}

async function main() {
  console.log("\n🌱 Emerald School — Firestore Seed Script");
  console.log("━".repeat(50));
  console.log(`  Project: emerald-app-da985`);
  console.log("━".repeat(50));

  try {
    await seedAdminProfiles();
    await seedSettings();
    await seedNotices();
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
