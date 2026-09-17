export type Portal = "admin" | "reseller";

const KEYS = {
  admin: {
    access: "kl_admin_access",
    refresh: "kl_admin_refresh",
    session: "kl_admin_session",
  },
  reseller: {
    access: "kl_reseller_access",
    refresh: "kl_reseller_refresh",
    session: "kl_reseller_session",
  },
} as const;

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getAccessToken(portal: Portal): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(KEYS[portal].access);
}

export function getRefreshToken(portal: Portal): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(KEYS[portal].refresh);
}

export function setTokens(
  portal: Portal,
  tokens: { accessToken: string; refreshToken: string },
) {
  if (!canUseStorage()) return;
  localStorage.setItem(KEYS[portal].access, tokens.accessToken);
  localStorage.setItem(KEYS[portal].refresh, tokens.refreshToken);
}

export function clearTokens(portal: Portal) {
  if (!canUseStorage()) return;
  localStorage.removeItem(KEYS[portal].access);
  localStorage.removeItem(KEYS[portal].refresh);
  localStorage.removeItem(KEYS[portal].session);
}

export function setSessionJson(portal: Portal, value: unknown) {
  if (!canUseStorage()) return;
  localStorage.setItem(KEYS[portal].session, JSON.stringify(value));
}

export function getSessionJson<T>(portal: Portal): T | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(KEYS[portal].session);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
