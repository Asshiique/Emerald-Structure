import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { findAccountByEmail } from "@/context/DataContext";

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
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USERS: Record<string, User> = {
  "admin@emerald.edu": {
    uid: "admin_001",
    name: "Dr. Thomas Joseph",
    role: "admin",
    classSection: "",
    rollNo: "",
    parentName: "",
    phone: "+91 98765 00001",
    email: "admin@emerald.edu",
  },
  "teacher@emerald.edu": {
    uid: "staff_001",
    name: "Mr. Rajan Krishnan",
    role: "teacher",
    classSection: "X-B",
    rollNo: "EIS/TCH/018",
    parentName: "",
    phone: "+91 98765 11001",
    email: "rajan@emerald.edu",
    department: "Mathematics",
  },
  "rajan@emerald.edu": {
    uid: "staff_001",
    name: "Mr. Rajan Krishnan",
    role: "teacher",
    classSection: "X-B",
    rollNo: "EIS/TCH/018",
    parentName: "",
    phone: "+91 98765 11001",
    email: "rajan@emerald.edu",
    department: "Mathematics",
  },
  "parent@emerald.edu": {
    uid: "stu_001",
    name: "Aryan Sharma",
    role: "parent",
    classSection: "X-B",
    rollNo: "EIS/2024/1024",
    parentName: "Rajesh Sharma",
    phone: "+91 98765 43210",
    email: "parent@emerald.edu",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("@emerald_user").then((stored) => {
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, _password: string): Promise<boolean> => {
    const normalized = email.toLowerCase().trim();
    const demoUser = DEMO_USERS[normalized];
    const dynamicUser = await findAccountByEmail(normalized);
    const chosen = demoUser ?? (dynamicUser ? {
      uid: dynamicUser.uid,
      name: dynamicUser.name,
      role: dynamicUser.role,
      classSection: dynamicUser.classSection,
      rollNo: dynamicUser.rollNo,
      parentName: dynamicUser.parentName,
      phone: dynamicUser.phone,
      email: dynamicUser.email,
      department: dynamicUser.department,
    } : null);

    if (!chosen) return false;

    await AsyncStorage.setItem("@emerald_user", JSON.stringify(chosen));
    setUser(chosen);
    return true;
  };

  const logout = async () => {
    await AsyncStorage.removeItem("@emerald_user");
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
