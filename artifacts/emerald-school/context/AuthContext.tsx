import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  uid: string;
  name: string;
  role: "parent" | "student" | "teacher" | "admin";
  classSection: string;
  rollNo: string;
  parentName: string;
  phone: string;
  email: string;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: Record<string, User> = {
  "parent@emerald.edu": {
    uid: "user_001",
    name: "Aryan Sharma",
    role: "student",
    classSection: "X-B",
    rollNo: "EIS/2024/1024",
    parentName: "Rajesh Sharma",
    phone: "+91 98765 43210",
    email: "parent@emerald.edu",
  },
  "admin@emerald.edu": {
    uid: "admin_001",
    name: "Principal Thomas",
    role: "admin",
    classSection: "",
    rollNo: "",
    parentName: "",
    phone: "+91 98765 00001",
    email: "admin@emerald.edu",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("@emerald_user").then((stored) => {
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, _password: string): Promise<boolean> => {
    const found = MOCK_USERS[email.toLowerCase().trim()];
    if (found) {
      await AsyncStorage.setItem("@emerald_user", JSON.stringify(found));
      setUser(found);
      return true;
    }
    const defaultUser = MOCK_USERS["parent@emerald.edu"]!;
    await AsyncStorage.setItem("@emerald_user", JSON.stringify(defaultUser));
    setUser(defaultUser);
    return true;
  };

  const logout = async () => {
    await AsyncStorage.removeItem("@emerald_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
