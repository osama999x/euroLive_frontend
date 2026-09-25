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

import { agencyApi } from "@/lib/api/agency";
import { ApiError, apiLogout } from "@/lib/api/client";
import type { Agency } from "@/lib/api/types";
import {
  clearTokens,
  getAccessToken,
  getSessionJson,
  setSessionJson,
  setTokens,
} from "@/lib/auth/tokens";

type AgencyAuthContextValue = {
  agency: Agency | null;
  loading: boolean;
  setSession: (
    agency: Agency,
    tokens: { accessToken: string; refreshToken: string },
  ) => void;
  refreshMe: () => Promise<Agency | null>;
  logout: () => Promise<void>;
};

const AgencyAuthContext = createContext<AgencyAuthContextValue | null>(null);

export function AgencyAuthProvider({ children }: { children: ReactNode }) {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const setSession = useCallback(
    (next: Agency, tokens: { accessToken: string; refreshToken: string }) => {
      setTokens("agency", tokens);
      setSessionJson("agency", next);
      setAgency(next);
      setLoading(false);
    },
    [],
  );

  const refreshMe = useCallback(async () => {
    if (!getAccessToken("agency")) {
      setAgency(null);
      return null;
    }
    const me = await agencyApi.me();
    setSessionJson("agency", me);
    setAgency(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout("agency");
    setAgency(null);
    router.replace("/agency/login");
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!getAccessToken("agency")) {
        clearTokens("agency");
        if (!cancelled) {
          setAgency(null);
          setLoading(false);
        }
        return;
      }

      const cached = getSessionJson<Agency>("agency");
      if (cached && !cancelled) setAgency(cached);

      try {
        const me = await agencyApi.me();
        if (!cancelled) {
          setSessionJson("agency", me);
          setAgency(me);
        }
      } catch (err) {
        const unauthorized =
          err instanceof ApiError && err.statusCode === 401;
        if (unauthorized || !getAccessToken("agency")) {
          clearTokens("agency");
          if (!cancelled) setAgency(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ agency, loading, setSession, refreshMe, logout }),
    [agency, loading, setSession, refreshMe, logout],
  );

  return (
    <AgencyAuthContext.Provider value={value}>{children}</AgencyAuthContext.Provider>
  );
}

export function useAgencyAuth() {
  const ctx = useContext(AgencyAuthContext);
  if (!ctx) throw new Error("useAgencyAuth must be used within AgencyAuthProvider");
  return ctx;
}
