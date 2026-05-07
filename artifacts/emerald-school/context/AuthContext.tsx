import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
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
  department?: string;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserPhoto: (photo: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const bootstrapping = useRef(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (bootstrapping.current) return;

      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            setUser({ uid: firebaseUser.uid, ...snap.data() } as User);
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    const resolve = async () => {
      await Promise.race([
        bootstrapApp(),
        new Promise<void>((r) => setTimeout(r, 8000)),
      ]).catch((e) => console.warn("Bootstrap error:", e));

      bootstrapping.current = false;

      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            setUser({ uid: firebaseUser.uid, ...snap.data() } as User);
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    resolve();

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (snap.exists()) {
        setUser({ uid: cred.user.uid, ...snap.data() } as User);
      }
      setIsLoading(false);
      return true;
    } catch {
      setIsLoading(false);
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
      await setDoc(doc(db, "users", user.uid), { profilePhoto: photo }, { merge: true });
    } catch {}
    setUser({ ...user, profilePhoto: photo });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUserPhoto }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
