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

import { appApi } from "@/lib/api/app";
import { ApiError, apiLogout } from "@/lib/api/client";
import type { AppUser } from "@/lib/api/types";
import {
  clearTokens,
  getAccessToken,
  getSessionJson,
  setSessionJson,
  setTokens,
} from "@/lib/auth/tokens";

type AppAuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  setSession: (
    user: AppUser,
    tokens: { accessToken: string; refreshToken: string },
  ) => void;
  refreshMe: () => Promise<AppUser | null>;
  logout: () => Promise<void>;
};

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const setSession = useCallback(
    (next: AppUser, tokens: { accessToken: string; refreshToken: string }) => {
      setTokens("app", tokens);
      setSessionJson("app", next);
      setUser(next);
      setLoading(false);
    },
    [],
  );

  const refreshMe = useCallback(async () => {
    if (!getAccessToken("app")) {
      setUser(null);
      return null;
    }
    const me = await appApi.me();
    setSessionJson("app", me);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout("app");
    setUser(null);
    router.replace("/app/login");
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!getAccessToken("app")) {
        clearTokens("app");
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const cached = getSessionJson<AppUser>("app");
      if (cached && !cancelled) setUser(cached);

      try {
        const me = await appApi.me();
        if (!cancelled) {
          setSessionJson("app", me);
          setUser(me);
        }
      } catch (err) {
        const unauthorized =
          err instanceof ApiError && err.statusCode === 401;
        if (unauthorized || !getAccessToken("app")) {
          clearTokens("app");
          if (!cancelled) setUser(null);
        }
        // Keep cached session on network / 5xx so portal does not bounce to login.
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
    () => ({ user, loading, setSession, refreshMe, logout }),
    [user, loading, setSession, refreshMe, logout],
  );

  return (
    <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const ctx = useContext(AppAuthContext);
  if (!ctx) throw new Error("useAppAuth must be used within AppAuthProvider");
  return ctx;
}
