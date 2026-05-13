/**
 * verify-admin-login.mjs
 * Verifies that admin Firebase accounts exist and can sign in.
 * Uses the Firebase Auth REST API — no service account key required.
 *
 * Run from emerald-school directory:
 *   node scripts/verify-admin-login.mjs
 */

const API_KEY = "AIzaSyAgTP4Z6hp6sDfScxC5SDLEJTtMLvHBRPg";

const ADMIN_ACCOUNTS = [
  { email: "ashiquemuhammed057@gmail.com",            password: "Emeraldismkd@1234" },
  { email: "emeraldinternationalschoolmkd@gmail.com", password: "Emeraldismkd@1234" },
  { email: "shiyasrgz@gmail.com",                     password: "Emeraldismkd@1234" },
];

async function signIn(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  return res.json();
}

async function signUp(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  return res.json();
}

console.log("\n🔍  Emerald — Admin Login Verification");
console.log("─".repeat(50));

for (const { email, password } of ADMIN_ACCOUNTS) {
  process.stdout.write(`\n📧  ${email}\n`);

  // Step 1: try signing in
  const loginResult = await signIn(email, password);

  if (loginResult.idToken) {
    console.log(`  ✅  Sign-in SUCCESS  (uid: ${loginResult.localId})`);
    continue;
  }

  const code = loginResult.error?.message ?? "UNKNOWN";
  console.log(`  ❌  Sign-in failed: ${code}`);

  // Step 2: if account doesn't exist, create it
  if (
    code === "EMAIL_NOT_FOUND" ||
    code === "INVALID_LOGIN_CREDENTIALS" ||
    code === "USER_DISABLED"
  ) {
    process.stdout.write(`  ⚙️   Attempting to create account…\n`);
    const createResult = await signUp(email, password);

    if (createResult.idToken) {
      console.log(`  ✅  Account CREATED  (uid: ${createResult.localId})`);
      console.log(`      ⚠️  NOTE: Firestore profile still needs to be created.`);
      console.log(`      ↳  Run: node scripts/seed-admin.mjs  (requires service-account.json)`);
      console.log(`      ↳  OR just sign in — the app will auto-create the Firestore profile.`);
    } else {
      console.log(`  ❌  Create failed: ${createResult.error?.message ?? "UNKNOWN"}`);
    }
  }
}

console.log("\n─".repeat(50));
console.log("Done. Fix any ❌ above before trying to log in.\n");
