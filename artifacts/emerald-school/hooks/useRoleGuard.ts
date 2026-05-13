import { router } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function useRoleGuard(allowedRoles: string[]) {
  const { user, isLoading } = useAuth();
  // Join to a stable string so the effect doesn't re-fire when the caller
  // passes a new array literal on every render (e.g. useRoleGuard(["admin"])).
  const rolesKey = allowedRoles.join(",");

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!rolesKey.split(",").includes(user.role)) {
      if (user.role === "admin") router.replace("/admin");
      else if (user.role === "teacher") router.replace("/teacher");
      else router.replace("/(tabs)");
    }
  }, [user?.role, isLoading, rolesKey]);
}
