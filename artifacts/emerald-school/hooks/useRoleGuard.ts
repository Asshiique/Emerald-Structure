import { router } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function useRoleGuard(allowedRoles: string[]) {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      if (user.role === "admin") router.replace("/admin" as any);
      else if (user.role === "teacher") router.replace("/teacher" as any);
      else router.replace("/(tabs)" as any);
    }
  }, [user?.role, isLoading]);
}
