// @ts-check
/**
 * Admin-SDK Firestore + Auth seed script for Emerald International School.
 *
 * Uses firebase-admin (server-side) so it is NEVER blocked by client API key
 * restrictions. Requires a service account key JSON file.
 *
 * Usage:
 *   1. Download your service account key from Firebase Console → Project Settings
 *      → Service Accounts → Generate new private key → save as
 *      scripts/service-account.json  (already in .gitignore)
 *   2. From the emerald-school directory run:
 *        node scripts/seed-admin.mjs
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SA_PATH = path.join(__dirname, "service-account.json");

if (!existsSync(SA_PATH)) {
  console.error(`
❌  Service account key not found at:
    ${SA_PATH}

To fix this:
  1. Go to Firebase Console → Project Settings → Service Accounts
  2. Click "Generate new private key"
  3. Save the downloaded file as:
     artifacts/emerald-school/scripts/service-account.json
  4. Re-run: node scripts/seed-admin.mjs
`);
  process.exit(1);
}

// Dynamic import of firebase-admin (ESM-compatible)
const admin = (await import("firebase-admin")).default;

const serviceAccount = JSON.parse(readFileSync(SA_PATH, "utf-8"));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "emerald-app-da985",
  });
}

const authAdmin = admin.auth();
const firestoreAdmin = admin.firestore();

const ok   = (m) => console.log(`  ✅ ${m}`);
const warn = (m) => console.log(`  ⚠️  ${m}`);
const info = (m) => console.log(`\n📋 ${m}`);
const log  = (m) => console.log(`  ${m}`);

const ADMIN_ACCOUNTS = [
  { email: "ashiquemuhammed057@gmail.com",            password: "Emeraldismkd@1234", name: "Ashique Mohammed" },
  { email: "emeraldinternationalschoolmkd@gmail.com", password: "Emeraldismkd@1234", name: "Emerald Admin" },
  { email: "shiyasrgz@gmail.com",                     password: "Emeraldismkd@1234", name: "Shiyas" },
];

// ─── Step 1: Admin Auth accounts + Firestore profiles ─────────────────────────
async function seedAdminProfiles() {
  info("Step 1 — Admin Auth accounts + Firestore profiles");

  for (const admin of ADMIN_ACCOUNTS) {
    log(`Processing ${admin.email}…`);
    let uid;

    // Try to get existing user
    try {
      const existing = await authAdmin.getUserByEmail(admin.email);
      uid = existing.uid;
      ok(`Auth user already exists: ${admin.email} (${uid})`);
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        // Create the Auth user server-side (no API key restriction here)
        try {
          const created = await authAdmin.createUser({
            email: admin.email,
            password: admin.password,
            displayName: admin.name,
            emailVerified: true,
          });
          uid = created.uid;
          ok(`Created Auth user: ${admin.email} (${uid})`);
        } catch (ce) {
          warn(`Failed to create Auth user ${admin.email}: ${ce.message}`);
          continue;
        }
      } else {
        warn(`Auth lookup error for ${admin.email}: ${e.message}`);
        continue;
      }
    }

    // Set custom claims so the backend auth middleware can read role from token
    try {
      await authAdmin.setCustomUserClaims(uid, { role: "admin" });
      ok(`Set custom claim role=admin for ${admin.email}`);
    } catch (e) {
      warn(`Failed to set custom claims for ${admin.email}: ${e.message}`);
    }

    // Upsert Firestore user profile
    const ref = firestoreAdmin.collection("users").doc(uid);
    await ref.set(
      {
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
      },
      { merge: true }
    );
    ok(`Firestore profile upserted for ${admin.email}`);
  }
}

// ─── Step 2: App settings ──────────────────────────────────────────────────────
async function seedSettings() {
  info("Step 2 — App settings");
  const ref = firestoreAdmin.collection("settings").doc("main");
  const snap = await ref.get();

  if (snap.exists) {
    ok("settings/main already exists — skipping");
    return;
  }

  await ref.set({
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
          { time: "8:30 – 9:10",   subject: "English",       teacher: "Ms. Anitha" },
          { time: "9:10 – 9:50",   subject: "Mathematics",   teacher: "Mr. Krishnan" },
          { time: "10:10 – 10:50", subject: "Malayalam",     teacher: "Mr. Suresh" },
          { time: "10:50 – 11:30", subject: "Science",       teacher: "Mr. Rajan" },
          { time: "11:30 – 12:10", subject: "Art & Craft",   teacher: "Ms. Meena" },
          { time: "1:00 – 1:40",   subject: "Social Studies",teacher: "Ms. Devi" },
          { time: "1:40 – 2:20",   subject: "Mathematics",   teacher: "Mr. Krishnan" },
        ],
      },
      {
        day: "Wednesday",
        slots: [
          { time: "8:30 – 9:10",   subject: "Science",            teacher: "Mr. Rajan" },
          { time: "9:10 – 9:50",   subject: "Social Studies",     teacher: "Ms. Devi" },
          { time: "10:10 – 10:50", subject: "English",            teacher: "Ms. Anitha" },
          { time: "10:50 – 11:30", subject: "Mathematics",        teacher: "Mr. Krishnan" },
          { time: "11:30 – 12:10", subject: "Computer Science",   teacher: "Ms. Nisha" },
          { time: "1:00 – 1:40",   subject: "Malayalam",          teacher: "Mr. Suresh" },
          { time: "1:40 – 2:20",   subject: "Art & Craft",        teacher: "Ms. Meena" },
        ],
      },
      {
        day: "Thursday",
        slots: [
          { time: "8:30 – 9:10",   subject: "Malayalam",          teacher: "Mr. Suresh" },
          { time: "9:10 – 9:50",   subject: "Science",            teacher: "Mr. Rajan" },
          { time: "10:10 – 10:50", subject: "Mathematics",        teacher: "Mr. Krishnan" },
          { time: "10:50 – 11:30", subject: "English",            teacher: "Ms. Anitha" },
          { time: "11:30 – 12:10", subject: "Social Studies",     teacher: "Ms. Devi" },
          { time: "1:00 – 1:40",   subject: "Physical Education", teacher: "Mr. Thomas" },
          { time: "1:40 – 2:20",   subject: "Science",            teacher: "Mr. Rajan" },
        ],
      },
      {
        day: "Friday",
        slots: [
          { time: "8:30 – 9:10",   subject: "Computer Science",   teacher: "Ms. Nisha" },
          { time: "9:10 – 9:50",   subject: "Malayalam",          teacher: "Mr. Suresh" },
          { time: "10:10 – 10:50", subject: "Art & Craft",        teacher: "Ms. Meena" },
          { time: "10:50 – 11:30", subject: "Science",            teacher: "Mr. Rajan" },
          { time: "11:30 – 12:10", subject: "Mathematics",        teacher: "Mr. Krishnan" },
          { time: "1:00 – 1:40",   subject: "English",            teacher: "Ms. Anitha" },
          { time: "1:40 – 2:20",   subject: "Social Studies",     teacher: "Ms. Devi" },
        ],
      },
    ],
  });
  ok("settings/main created");
}

// ─── Step 3: Sample notices ────────────────────────────────────────────────────
async function seedNotices() {
  info("Step 3 — Sample notices (Firestore)");
  const snap = await firestoreAdmin.collection("notices").get();

  if (!snap.empty) {
    ok(`notices already has ${snap.size} doc(s) — skipping`);
    return;
  }

  const now = Date.now();
  const day = 86_400_000;

  const notices = [
    {
      id: "notice_001",
      title: "Welcome to Emerald International School",
      body: "We are pleased to welcome all students and parents to the new academic year 2025-26. Classes commence on 1st June 2025. Please ensure all required documents are submitted to the office by 28th May.",
      category: "General",
      targetRole: "all",
      postedAt: new Date(now).toISOString(),
      isRead: false,
    },
    {
      id: "notice_002",
      title: "Annual Fee Payment Reminder",
      body: "This is a reminder that the first-term annual fee is due on or before 15th June 2025. Late payments will attract a penalty of ₹50 per day. Please contact the accounts office for any fee-related queries.",
      category: "Fees",
      targetRole: "parent",
      postedAt: new Date(now - day).toISOString(),
      isRead: false,
    },
    {
      id: "notice_003",
      title: "Parent-Teacher Meeting — Class 8 & 9",
      body: "A Parent-Teacher Meeting is scheduled for Saturday, 24th May 2025 from 9:00 AM to 12:00 PM. All parents of Class 8 and Class 9 students are requested to attend.",
      category: "Events",
      targetRole: "parent",
      postedAt: new Date(now - 2 * day).toISOString(),
      isRead: false,
    },
    {
      id: "notice_004",
      title: "Revised Sports Day Schedule",
      body: "Due to weather concerns, the Annual Sports Day has been rescheduled to 20th May 2025. Venue remains the school ground. All participants report by 7:30 AM in sports uniform.",
      category: "Sports",
      targetRole: "all",
      postedAt: new Date(now - 3 * day).toISOString(),
      isRead: false,
    },
    {
      id: "notice_005",
      title: "Unit Test — Science & Mathematics (Class 6–10)",
      body: "Unit tests are scheduled for the week of 26th–30th May 2025. Students must bring their own stationery. Calculators are NOT permitted.",
      category: "Academic",
      targetRole: "all",
      postedAt: new Date(now - 5 * day).toISOString(),
      isRead: false,
    },
  ];

  const batch = firestoreAdmin.batch();
  for (const n of notices) {
    const { id, ...data } = n;
    batch.set(firestoreAdmin.collection("notices").doc(id), data);
  }
  await batch.commit();
  ok(`Created ${notices.length} sample notices`);
}

// ─── Step 4: Summary ──────────────────────────────────────────────────────────
async function printSummary() {
  info("Firestore collection summary");
  const cols = ["users", "settings", "notices", "staff", "students", "attendance", "homework", "gallery", "evaluations"];
  for (const name of cols) {
    const snap = await firestoreAdmin.collection(name).get();
    log(`${name.padEnd(14)} → ${snap.size > 0 ? snap.size + " doc(s)" : "empty"}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌱  Emerald School — Firestore Admin Seed");
  console.log("━".repeat(50));

  try {
    await seedAdminProfiles();
    await seedSettings();
    await seedNotices();
    await printSummary();

    console.log("\n✅ Seed complete! Admin login credentials:");
    for (const a of ADMIN_ACCOUNTS) {
      console.log(`   📧 ${a.email}`);
      console.log(`   🔑 ${a.password}\n`);
    }
  } catch (err) {
    console.error("\n❌ Seed failed:", err.message ?? err);
    console.error(err);
    process.exit(1);
  }

  process.exit(0);
}

main();
