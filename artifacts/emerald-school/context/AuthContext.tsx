import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { bootstrapApp } from "@/lib/firebaseBootstrap";

export interface User {
  uid: string;
  name: string;
  role: "parent" | "student" | "teacher" | "admin";
  classSection: string;
  rollNo: string;
  parentName: string;
  phone: string;
  email: string;
  hasSeenWelcome?: boolean;
  department?: string;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  /** True ONLY during the initial cold-boot session resolution. Never true during login(). */
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: true } | { success: false; code?: string; message?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  lastAuthError: { code?: string; message?: string } | null;
  updateUserPhoto: (photo: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_EMAILS = new Set([
  "ashiquemuhammed057@gmail.com",
  "emeraldinternationalschoolmkd@gmail.com",
  "shiyasrgz@gmail.com",
]);

/** Fetch (or auto-create) a user profile from Firestore. Returns null if not found. */
async function fetchUserProfile(uid: string, email: string): Promise<User | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      return { uid, ...snap.data() } as User;
    }

    // Auto-provision profile for known admin emails when the Firestore doc is absent.
    const normalizedEmail = email.toLowerCase().trim();
    if (ADMIN_EMAILS.has(normalizedEmail)) {
      const adminProfile: User = {
        uid,
        name: normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: "admin",
        classSection: "",
        rollNo: "",
        parentName: "",
        phone: "",
        department: "",
      };
      await setDoc(doc(db, "users", uid), adminProfile, { merge: true });
      return adminProfile;
    }

    return null;
  } catch (e) {
    console.warn("[AuthContext] fetchUserProfile error:", e);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  /**
   * isLoading is ONLY flipped to false once — after bootstrapApp() completes
   * and we've done the cold-boot currentUser check. login() never touches it.
   * This ensures AppReadyNavigator's Stack stays mounted during a login attempt.
   */
  const [isLoading, setIsLoading] = useState(true);
  const [lastAuthError, setLastAuthError] = useState<{
    code?: string;
    message?: string;
  } | null>(null);

  // Guards so onAuthStateChanged doesn't race with login() or bootstrap.
  const bootstrapping = useRef(true);
  const loginInProgress = useRef(false);

  useEffect(() => {
    /**
     * onAuthStateChanged handles ONLY two cases:
     *   1. Session restored externally (e.g. token refresh while app is backgrounded).
     *   2. Explicit signOut() — clears user.
     *
     * It is intentionally suppressed during bootstrap AND during login() so it
     * cannot race-overwrite the user set by login()'s own Firestore fetch.
     */
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (bootstrapping.current || loginInProgress.current) return;

      if (firebaseUser) {
        const profile = await fetchUserProfile(
          firebaseUser.uid,
          firebaseUser.email ?? ""
        );
        // Double-check: login() may have completed while we awaited Firestore.
        if (!loginInProgress.current) {
          setUser(profile);
        }
      } else {
        setUser(null);
      }
    });

    /** Cold-boot: run bootstrap then restore any existing Firebase session. */
    const coldBoot = async () => {
      await bootstrapApp().catch((e) =>
        console.warn("[AuthContext] Bootstrap error:", e)
      );

      bootstrapping.current = false;

      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        const profile = await fetchUserProfile(
          firebaseUser.uid,
          firebaseUser.email ?? ""
        );
        setUser(profile);
      } else {
        setUser(null);
      }

      // Only ever set to false here — never inside login().
      setIsLoading(false);
    };

    coldBoot();

    return () => unsubscribe();
  }, []);

  /**
   * login() is completely self-contained.
   * It does NOT touch the shared `isLoading` state so the Stack stays mounted
   * and router.replace("/") works immediately after success.
   * The caller (login.tsx) manages its own local loading spinner.
   */
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: true } | { success: false; code?: string; message?: string }> => {
    setLastAuthError(null);
    loginInProgress.current = true;

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);

      const profile = await fetchUserProfile(cred.user.uid, normalizedEmail);

      if (!profile) {
        await signOut(auth);
        loginInProgress.current = false;
        const err = {
          code: "profile/missing",
          message: "User profile is missing. Contact admin support.",
        };
        setLastAuthError(err);
        return { success: false, ...err };
      }

      setUser(profile);
      loginInProgress.current = false;
      return { success: true };
    } catch (e: any) {
      console.warn("[AuthContext] Login failed:", e?.code, e?.message);
      loginInProgress.current = false;
      const err = {
        code: e?.code as string | undefined,
        message: e?.message as string | undefined,
      };
      setLastAuthError(err);
      return { success: false, ...err };
    }
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
      setLastAuthError(null);
      await sendPasswordResetEmail(auth, email.toLowerCase().trim());
      return true;
    } catch (e: any) {
      console.warn("[AuthContext] Password reset failed:", e?.code, e?.message);
      setLastAuthError({ code: e?.code, message: e?.message });
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateUserPhoto = async (photo: string) => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { profilePhoto: photo },
        { merge: true }
      );
    } catch {}
    setUser({ ...user, profilePhoto: photo });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        requestPasswordReset,
        lastAuthError,
        updateUserPhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
