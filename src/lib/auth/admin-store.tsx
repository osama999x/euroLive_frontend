"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { adminApi } from "@/lib/api/admin";
import type { Staff } from "@/lib/api/types";
import { apiLogout } from "@/lib/api/client";
import {
  clearTokens,
  getAccessToken,
  getSessionJson,
  setSessionJson,
  setTokens,
} from "@/lib/auth/tokens";

type AdminAuthContextValue = {
  staff: Staff | null;
  loading: boolean;
  setSession: (staff: Staff, tokens: { accessToken: string; refreshToken: string }) => void;
  patchStaff: (partial: Partial<Staff>) => void;
  refreshMe: () => Promise<Staff | null>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const setSession = useCallback(
    (next: Staff, tokens: { accessToken: string; refreshToken: string }) => {
      setTokens("admin", tokens);
      setSessionJson("admin", next);
      setStaff(next);
    },
    [],
  );

  const patchStaff = useCallback((partial: Partial<Staff>) => {
    setStaff((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      setSessionJson("admin", next);
      return next;
    });
  }, []);

  const refreshMe = useCallback(async () => {
    if (!getAccessToken("admin")) {
      setStaff(null);
      return null;
    }
    const me = await adminApi.me();
    setSessionJson("admin", me);
    setStaff(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout("admin");
    setStaff(null);
    router.replace("/admin/login");
  }, [router]);

  useEffect(() => {
    if (!getAccessToken("admin")) {
      clearTokens("admin");
      setStaff(null);
      setLoading(false);
      return;
    }
    const cached = getSessionJson<Staff>("admin");
    if (cached) setStaff(cached);
    refreshMe()
      .catch(() => {
        clearTokens("admin");
        setStaff(null);
      })
      .finally(() => setLoading(false));
  }, [refreshMe]);

  const value = useMemo(
    () => ({ staff, loading, setSession, patchStaff, refreshMe, logout }),
    [staff, loading, setSession, patchStaff, refreshMe, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
