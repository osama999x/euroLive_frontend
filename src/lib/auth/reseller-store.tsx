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

import { apiLogout } from "@/lib/api/client";
import { resellerApi } from "@/lib/api/reseller";
import type { Reseller } from "@/lib/api/types";
import {
  clearTokens,
  getAccessToken,
  getSessionJson,
  setSessionJson,
  setTokens,
} from "@/lib/auth/tokens";

type ResellerAuthContextValue = {
  reseller: Reseller | null;
  loading: boolean;
  setSession: (
    reseller: Reseller,
    tokens: { accessToken: string; refreshToken: string },
  ) => void;
  refreshMe: () => Promise<Reseller | null>;
  logout: () => Promise<void>;
};

const ResellerAuthContext = createContext<ResellerAuthContextValue | null>(null);

export function ResellerAuthProvider({ children }: { children: ReactNode }) {
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const setSession = useCallback(
    (next: Reseller, tokens: { accessToken: string; refreshToken: string }) => {
      setTokens("reseller", tokens);
      setSessionJson("reseller", next);
      setReseller(next);
    },
    [],
  );

  const refreshMe = useCallback(async () => {
    if (!getAccessToken("reseller")) {
      setReseller(null);
      return null;
    }
    const me = await resellerApi.me();
    setSessionJson("reseller", me);
    setReseller(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout("reseller");
    setReseller(null);
    router.replace("/reseller/login");
  }, [router]);

  useEffect(() => {
    if (!getAccessToken("reseller")) {
      clearTokens("reseller");
      setReseller(null);
      setLoading(false);
      return;
    }
    const cached = getSessionJson<Reseller>("reseller");
    if (cached) setReseller(cached);
    refreshMe()
      .catch(() => {
        clearTokens("reseller");
        setReseller(null);
      })
      .finally(() => setLoading(false));
  }, [refreshMe]);

  const value = useMemo(
    () => ({ reseller, loading, setSession, refreshMe, logout }),
    [reseller, loading, setSession, refreshMe, logout],
  );

  return (
    <ResellerAuthContext.Provider value={value}>
      {children}
    </ResellerAuthContext.Provider>
  );
}

export function useResellerAuth() {
  const ctx = useContext(ResellerAuthContext);
  if (!ctx) {
    throw new Error("useResellerAuth must be used within ResellerAuthProvider");
  }
  return ctx;
}
