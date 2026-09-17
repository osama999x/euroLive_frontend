"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Refetch list data whenever:
 * - the route is (re)entered
 * - filters/deps change
 * - ?r= query bumps after create
 * - window regains focus
 */
export function useListRefresh(deps: unknown[] = []) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const refreshToken = searchParams.get("r") ?? "";
  const [focusTick, setFocusTick] = useState(0);

  useEffect(() => {
    const bump = () => setFocusTick((t) => t + 1);
    const onVis = () => {
      if (document.visibilityState === "visible") bump();
    };
    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", bump);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return { pathname, refreshToken, focusTick, key: `${pathname}|${refreshToken}|${focusTick}|${deps.join("|")}` };
}

export function useAfterCreateNavigate() {
  return useCallback((basePath: string, id?: string) => {
    const r = Date.now().toString();
    const url = id
      ? `${basePath}?r=${r}&highlight=${encodeURIComponent(id)}`
      : `${basePath}?r=${r}`;
    return url;
  }, []);
}
