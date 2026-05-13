// @ts-check
/**
 * Firestore seed script for Emerald International School.
 * Run from repo root:
 *   node --input-type=module < scripts/seed-firestore.mjs
 * OR:
 *   node scripts/seed-firestore.mjs   (if this file is .mjs)
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
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAgTP4Z6hp6sDfScxC5SDLEJTtMLvHBRPg",
  authDomain: "emerald-app-da985.firebaseapp.com",
  projectId: "emerald-app-da985",
  storageBucket: "emerald-app-da985.firebasestorage.app",
  messagingSenderId: "799787181926",
  appId: "1:799787181926:web:473ab1dce9ea158f144aa7",
};

const ADMIN_ACCOUNTS = [
  { email: "ashiquemuhammed057@gmail.com",            password: "Emeraldismkd@1234", name: "Ashique Mohammed" },
  { email: "emeraldinternationalschoolmkd@gmail.com", password: "Emeraldismkd@1234", name: "Emerald Admin" },
  { email: "shiyasrgz@gmail.com",                     password: "Emeraldismkd@1234", name: "Shiyas" },
];

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const ok   = (m) => console.log(`  ✅ ${m}`);
const warn = (m) => console.log(`  ⚠️  ${m}`);
const info = (m) => console.log(`\n📋 ${m}`);
const log  = (m) => console.log(`  ${m}`);

async function checkCollection(name) {
  const snap = await getDocs(collection(db, name));
  return snap.size;
}

async function ensureAdminAuth(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await signOut(auth);
    return cred.user.uid;
  } catch (e) {
    const missing = e.code === "auth/user-not-found"
      || e.code === "auth/invalid-credential"
      || e.code === "auth/invalid-login-credentials";

    if (missing) {
      try {
        const tempApp  = initializeApp(firebaseConfig, `tmp_${Date.now()}`);
        const tempAuth = getAuth(tempApp);
        const cred = await createUserWithEmailAndPassword(tempAuth, email, password);
        const uid = cred.user.uid;
        await signOut(tempAuth);
        await deleteApp(tempApp);
        return uid;
      } catch (ce) {
        if (ce.code !== "auth/email-already-in-use") warn(`Create failed for ${email}: ${ce.message}`);
        return null;
      }
    }
    warn(`Auth check for ${email}: ${e.code} — ${e.message}`);
    return null;
  }
}

async function seedAdminProfiles() {
  info("Step 1 — Admin Auth accounts + Firestore profiles");
  for (const admin of ADMIN_ACCOUNTS) {
    log(`Processing ${admin.email}…`);
    const uid = await ensureAdminAuth(admin.email, admin.password);
    if (!uid) { warn(`No UID obtained for ${admin.email} — skipping Firestore write`); continue; }

    const ref = doc(db, "users", uid);
    const existing = await getDoc(ref);
    const profile = { uid, name: admin.name, email: admin.email, role: "admin",
      classSection: "", department: "", phone: "", rollNo: "", parentName: "", hasSeenWelcome: true };

    if (!existing.exists()) {
      await setDoc(ref, profile);
      ok(`Created profile for ${admin.email} (uid: ${uid})`);
    } else {
      await setDoc(ref, { role: "admin", hasSeenWelcome: true }, { merge: true });
      ok(`Profile exists for ${admin.email} — ensured role=admin`);
    }
  }
}

async function seedSettings() {
  info("Step 2 — App settings");
  const ref = doc(db, "settings", "main");
  const existing = await getDoc(ref);
  if (existing.exists()) { ok("settings/main already exists — skipping"); return; }

  await setDoc(ref, {
    schoolName: "Emerald International School",
    address: "Vadakkumannam, Mannarkkad, Palakkad, Kerala",
    phone: "+91 6238960292, +91 7356596745",
    email: "emeraldinternationalschoolmkd@gmail.com",
    principalName: "Shalima Soman",
    academicYear: "2025-26",
    firstLoginParents: [],
    timetable: [
      { day: "Monday", slots: [
          { time: "8:30 – 9:10",   subject: "Mathematics",        teacher: "Mr. Krishnan" },
          { time: "9:10 – 9:50",   subject: "English",            teacher: "Ms. Anitha" },
          { time: "10:10 – 10:50", subject: "Science",            teacher: "Mr. Rajan" },
          { time: "10:50 – 11:30", subject: "Social Studies",     teacher: "Ms. Devi" },
          { time: "11:30 – 12:10", subject: "Malayalam",          teacher: "Mr. Suresh" },
          { time: "1:00 – 1:40",   subject: "Physical Education", teacher: "Mr. Thomas" },
          { time: "1:40 – 2:20",   subject: "Computer Science",   teacher: "Ms. Nisha" },
      ]},
      { day: "Tuesday", slots: [
          { time: "8:30 – 9:10",   subject: "English",       teacher: "Ms. Anitha" },
          { time: "9:10 – 9:50",   subject: "Mathematics",   teacher: "Mr. Krishnan" },
          { time: "10:10 – 10:50", subject: "Malayalam",     teacher: "Mr. Suresh" },
          { time: "10:50 – 11:30", subject: "Science",       teacher: "Mr. Rajan" },
          { time: "11:30 – 12:10", subject: "Art & Craft",   teacher: "Ms. Meena" },
          { time: "1:00 – 1:40",   subject: "Social Studies",teacher: "Ms. Devi" },
          { time: "1:40 – 2:20",   subject: "Mathematics",   teacher: "Mr. Krishnan" },
      ]},
    ],
  });
  ok("settings/main created");
}

async function seedNotices() {
  info("Step 3 — Sample notices (Firestore legacy collection)");
  const count = await checkCollection("notices");
  if (count > 0) { ok(`notices already has ${count} doc(s) — skipping`); return; }

  const batch = writeBatch(db);
  const now = Date.now();
  const day = 86400000;

  const notices = [
    { id: "notice_001", title: "Welcome to Emerald International School",
      body: "We are pleased to welcome all students and parents to the new academic year 2025-26. Classes commence on 1st June 2025. Please ensure all required documents are submitted to the office by 28th May.",
      category: "General", targetRole: "all", time: "Today", postedAt: new Date(now).toISOString(), isRead: false },
    { id: "notice_002", title: "Annual Fee Payment Reminder",
      body: "This is a reminder that the first-term annual fee is due on or before 15th June 2025. Late payments will attract a penalty of ₹50 per day. Please contact the accounts office for any fee-related queries.",
      category: "Fees", targetRole: "parent", time: "Yesterday", postedAt: new Date(now - day).toISOString(), isRead: false },
    { id: "notice_003", title: "Parent-Teacher Meeting — Class 8 & 9",
      body: "A Parent-Teacher Meeting is scheduled for Saturday, 24th May 2025 from 9:00 AM to 12:00 PM. All parents of Class 8 and Class 9 students are requested to attend.",
      category: "Events", targetRole: "parent", time: "2 days ago", postedAt: new Date(now - 2*day).toISOString(), isRead: false },
    { id: "notice_004", title: "Revised Sports Day Schedule",
      body: "Due to weather concerns, the Annual Sports Day has been rescheduled to 20th May 2025. Venue remains the school ground. All participants report by 7:30 AM in sports uniform.",
      category: "Sports", targetRole: "all", time: "3 days ago", postedAt: new Date(now - 3*day).toISOString(), isRead: false },
    { id: "notice_005", title: "Unit Test — Science & Mathematics (Class 6–10)",
      body: "Unit tests are scheduled for the week of 26th–30th May 2025. Students must bring their own stationery. Calculators are NOT permitted.",
      category: "Academic", targetRole: "all", time: "5 days ago", postedAt: new Date(now - 5*day).toISOString(), isRead: false },
  ];

  for (const n of notices) batch.set(doc(db, "notices", n.id), n);
  await batch.commit();
  ok(`Created ${notices.length} sample notices`);
}

async function printSummary() {
  info("Firestore collection summary");
  const cols = ["users","settings","notices","staff","students","attendance","homework","gallery","evaluations"];
  for (const name of cols) {
    const count = await checkCollection(name);
    log(`${name.padEnd(14)} → ${count > 0 ? count + " doc(s)" : "empty"}`);
  }
}

async function main() {
  console.log("\n🌱  Emerald School — Firestore Seed");
  console.log("━".repeat(48));
  try {
    await seedAdminProfiles();
    await seedSettings();
    await seedNotices();
    await printSummary();
    console.log("\n✅ Done! Admin login credentials:");
    for (const a of ADMIN_ACCOUNTS) {
      console.log(`   📧 ${a.email}`);
      console.log(`   🔑 ${a.password}\n`);
    }
  } catch (err) {
    console.error("\n❌ Seed failed:", err.message ?? err);
    console.error(err);
  } finally {
    await deleteApp(app);
    process.exit(0);
  }
}

main();
