import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
} from "firebase/firestore";
import { auth, db, firebaseConfig } from "./firebase";

const BOOTSTRAP_KEY = "@emerald_bootstrapped_v5";

const ADMIN_ACCOUNTS = [
  { email: "ashiquemuhammed057@gmail.com", password: "Emeraldismkd@1234", name: "Ashique Mohammed" },
  { email: "emeraldinternationalschoolmkd@gmail.com", password: "Emeraldismkd@1234", name: "Emerald Admin" },
  { email: "shiyasrgz@gmail.com", password: "Emeraldismkd@1234", name: "Shiyas" },
];

import { getReactNativePersistence, initializeAuth } from "firebase/auth";

export async function createFirebaseAccount(
  email: string,
  password: string,
  userData: Record<string, unknown>
): Promise<string> {
  const tempApp = initializeApp(firebaseConfig, `temp_${Date.now()}`);
  
  // Must use initializeAuth with AsyncStorage on React Native, 
  // otherwise getAuth() throws an error in Expo Go.
  const tempAuth = initializeAuth(tempApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

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

export async function bootstrapApp(): Promise<void> {
  const done = await AsyncStorage.getItem(BOOTSTRAP_KEY);
  if (done === "true") return;

  let bootstrapped = false;

  for (const admin of ADMIN_ACCOUNTS) {
    try {
      const cred = await signInWithEmailAndPassword(auth, admin.email, admin.password);
      await ensureAdminProfile(cred.user.uid, admin.name, admin.email);
      bootstrapped = true;
      await signOut(auth);
      continue;
    } catch (e: any) {
      const isUserMissing =
        e.code === "auth/user-not-found" ||
        e.code === "auth/invalid-credential" ||
        e.code === "auth/invalid-login-credentials";

      // If the user exists with a different password, we can't fix it from the client.
      if (!isUserMissing) {
        console.warn(`Bootstrap admin skipped (${admin.email}):`, e?.message ?? e);
        continue;
      }

      try {
        await createFirebaseAccount(admin.email, admin.password, {
          name: admin.name,
          email: admin.email,
          role: "admin",
          classSection: "",
          department: "",
          phone: "",
          rollNo: "",
          parentName: "",
        });
        bootstrapped = true;
      } catch (ce: any) {
        if (ce?.code !== "auth/email-already-in-use") {
          console.warn(`Bootstrap admin create failed (${admin.email}):`, ce?.message ?? ce);
        }
      }
    }
  }

  if (bootstrapped) {
    await AsyncStorage.setItem(BOOTSTRAP_KEY, "true");
  }
}
