/**
 * seed-students.ts
 *
 * Reads Students Data.xlsx and seeds all students into Firestore.
 *
 * Source columns  → Firestore field mapping:
 *   ADMISSION NO   → admissionNo (string)
 *   NAME           → name (trimmed)
 *   CLASS          → classSection (normalised: "LKG B" → "LKG-B")
 *   SEX            → gender ("MALE" | "FEMALE")
 *   ADDRESS        → address (trimmed)
 *   FATHER NAME    → parentName (father's name, trimmed)
 *   MOTHER NAME    → motherName (trimmed)
 *   MOBILE 1       → parentPhone (E.164 formatted)
 *   MOBILE 2       → parentWhatsApp (E.164 formatted, may be empty)
 *   D.B            → dob (ISO date "YYYY-MM-DD")
 *   RELIGION       → religion (trimmed)
 *   COMMUNITY      → community (trimmed)
 *   OCCUPATION OF FATHER → fatherOccupation (trimmed)
 *   JOIN DATE      → joinDate (ISO date or empty)
 *   SI.NO          → rollNo (string, per-class serial number)
 *
 * Run:
 *   node --loader ts-node/esm scripts/src/seed-students.ts
 *   OR (preferred):
 *   cd scripts && npx tsx src/seed-students.ts
 */

import { initializeApp, deleteApp } from "firebase/app";
import {
  getFirestore,
  doc,
  writeBatch,
  collection,
  getDocs,
} from "firebase/firestore";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
// xlsx is a CJS module — must be required, not ESM-imported
// eslint-disable-next-line @typescript-eslint/no-var-requires
const XLSX = require("xlsx") as typeof import("xlsx");

// ─── Firebase config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAgTP4Z6hp6sDfScxC5SDLEJTtMLvHBRPg",
  authDomain: "emerald-app-da985.firebaseapp.com",
  projectId: "emerald-app-da985",
  storageBucket: "emerald-app-da985.firebasestorage.app",
  messagingSenderId: "799787181926",
  appId: "1:799787181926:web:473ab1dce9ea158f144aa7",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function log(msg: string)  { console.log(`  ${msg}`); }
function ok(msg: string)   { console.log(`  ✅ ${msg}`); }
function warn(msg: string) { console.log(`  ⚠️  ${msg}`); }
function info(msg: string) { console.log(`\n📋 ${msg}`); }

/** Convert a number (Excel phone field) or string to E.164 string */
function formatPhone(raw: string | number): string {
  if (raw === "" || raw === null || raw === undefined) return "";
  const str = String(raw).replace(/\D/g, ""); // strip non-digits
  if (str.length === 10) return `+91${str}`;
  if (str.length === 12 && str.startsWith("91")) return `+${str}`;
  if (str.length === 13 && str.startsWith("091")) return `+91${str.slice(3)}`;
  // Already looks like an international number
  if (str.length > 10) return `+${str}`;
  return str; // fallback — leave as-is
}

/** Parse DD.MM.YYYY or DD.MM.YY or similar date strings to YYYY-MM-DD */
function parseDate(raw: string): string {
  if (!raw || typeof raw !== "string" || raw.trim() === "") return "";
  const cleaned = raw.trim();

  // Handle DD.MM.YYYY or DD.MM.YY
  const parts = cleaned.split(/[.\-\/]/);
  if (parts.length === 3) {
    const [d, m, y] = parts.map((p) => p.padStart(2, "0"));
    const year = y.length === 2 ? `20${y}` : y;
    const month = m.padStart(2, "0");
    const day = d.padStart(2, "0");
    // Validate
    const dt = new Date(`${year}-${month}-${day}`);
    if (!isNaN(dt.getTime())) return `${year}-${month}-${day}`;
  }

  return cleaned; // fallback — return as-is
}

/** Normalise class section strings (e.g. "LKG B" → "LKG-B") */
function normaliseClass(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim().toUpperCase();
  // "LKG B" → "LKG-B", "UKG B" → "UKG-B"
  return trimmed.replace(/^(LKG|UKG)\s+(.+)$/, "$1-$2");
}

/** Generate a stable Firestore doc ID from admission number */
function makeStudentId(admissionNo: string | number): string {
  const adm = String(admissionNo).trim().replace(/\s+/g, "_");
  return `stu_adm_${adm}`;
}

// ─── Excel parsing ────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const EXCEL_PATH = join(
  __dirname,
  "../../artifacts/emerald-school/assets/Students Data/Students Data.xlsx"
);

info("Reading Excel file…");
log(`Path: ${EXCEL_PATH}`);

const workbook = XLSX.readFile(EXCEL_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];

log(`Rows parsed: ${rawRows.length}`);

// ─── Transform rows into Student documents ────────────────────────────────────
interface StudentDoc {
  id: string;
  admissionNo: string;
  name: string;
  classSection: string;
  gender: "Male" | "Female";
  dob: string;
  address: string;
  parentName: string;       // Father's name
  motherName: string;
  fatherOccupation: string;
  parentPhone: string;      // Mobile 1
  parentWhatsApp: string;   // Mobile 2
  religion: string;
  community: string;
  rollNo: string;           // SI.NO (serial within spreadsheet)
  joinDate: string;
  parentEmail: string;      // Not in spreadsheet — left blank
  prevSchool: string;       // Not in spreadsheet — left blank
  bloodGroup: string;       // Not in spreadsheet — left blank
}

const students: StudentDoc[] = [];
const skipped: typeof rawRows = [];

for (const row of rawRows) {
  const admNo = String(row["ADMISSION NO"] ?? "").trim();
  const name = String(row["NAME "] ?? "").trim();

  if (!admNo || !name) {
    warn(`Skipping row SI=${row["SI.NO "]} — missing admission no or name: ${name || "(no name)"}`);
    skipped.push(row);
    continue;
  }

  const rawGender = String(row["SEX"] ?? "").trim().toUpperCase();
  const gender: "Male" | "Female" = rawGender === "FEMALE" ? "Female" : "Male";

  const student: StudentDoc = {
    id: makeStudentId(admNo),
    admissionNo: admNo,
    name,
    classSection: normaliseClass(String(row["CLASS"] ?? "")),
    gender,
    dob: parseDate(String(row["D.B"] ?? "")),
    address: String(row["ADDRESS"] ?? "").trim(),
    parentName: String(row["FATHER NAME "] ?? "").trim(),
    motherName: String(row["MOTHER NAME "] ?? "").trim(),
    fatherOccupation: String(row["OCCUPATION OF FATHER "] ?? "").trim(),
    parentPhone: formatPhone(row["MOBILE 1"] as string | number),
    parentWhatsApp: formatPhone(row["MOBILE  2"] as string | number),
    religion: String(row["RELIGION"] ?? "").trim(),
    community: String(row["COMMUNITY "] ?? "").trim(),
    rollNo: String(row["SI.NO "] ?? "").trim(),
    joinDate: parseDate(String(row["JOIN DATE "] ?? "")),
    parentEmail: "",
    prevSchool: "",
    bloodGroup: "",
  };

  students.push(student);
}

log(`Students to seed: ${students.length}`);
if (skipped.length > 0) {
  warn(`Skipped ${skipped.length} row(s) with missing data`);
}

// ─── Firestore seeding ────────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

async function checkExistingStudents(): Promise<Set<string>> {
  const snap = await getDocs(collection(db, "students"));
  const existing = new Set<string>();
  snap.forEach((d) => existing.add(d.id));
  return existing;
}

async function seedStudents(): Promise<void> {
  info("Checking existing students in Firestore…");
  const existing = await checkExistingStudents();
  log(`Existing student docs: ${existing.size}`);

  const toCreate = students.filter((s) => !existing.has(s.id));
  const toSkip   = students.filter((s) =>  existing.has(s.id));

  log(`Will create: ${toCreate.length}  |  Already exists (skip): ${toSkip.length}`);

  if (toCreate.length === 0) {
    ok("All students already exist — nothing to seed!");
    return;
  }

  // Firestore writeBatch max is 500 ops — chunk into batches
  const BATCH_SIZE = 400;
  let written = 0;

  for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
    const chunk = toCreate.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const student of chunk) {
      const { id, ...data } = student;
      batch.set(doc(db, "students", id), data);
    }
    await batch.commit();
    written += chunk.length;
    log(`  Batch committed: ${written}/${toCreate.length}`);
  }

  ok(`Successfully seeded ${written} students into Firestore!`);
}

// ─── Summary after seeding ────────────────────────────────────────────────────
async function printSummary(): Promise<void> {
  info("Summary — students by class section");
  const snap = await getDocs(collection(db, "students"));
  const byClass: Record<string, number> = {};
  snap.forEach((d) => {
    const cls = (d.data().classSection as string) || "UNKNOWN";
    byClass[cls] = (byClass[cls] || 0) + 1;
  });

  const sorted = Object.entries(byClass).sort(([a], [b]) => a.localeCompare(b));
  let total = 0;
  for (const [cls, count] of sorted) {
    log(`${cls.padEnd(10)} → ${count} student(s)`);
    total += count;
  }
  log(`${"─".repeat(24)}`);
  log(`${"TOTAL".padEnd(10)} → ${total} student(s)`);
}

// ─── Entry point ─────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("\n🌱 Emerald School — Student Data Seed");
  console.log("━".repeat(50));
  console.log(`  Source:  Students Data.xlsx (${rawRows.length} rows)`);
  console.log(`  Project: emerald-app-da985`);
  console.log("━".repeat(50));

  try {
    await seedStudents();
    await printSummary();
    console.log("\n✅ Done!\n");
  } catch (err: unknown) {
    const e = err as Error;
    console.error("\n❌ Seed failed:", e.message ?? err);
    console.error(err);
  } finally {
    await deleteApp(app);
    process.exit(0);
  }
}

main();
