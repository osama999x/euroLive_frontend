import { apiFetch } from "@/lib/api/client";
import type {
  AssignDuration,
  AssignedItem,
  CatalogItem,
  CatalogType,
  Paginated,
  Reseller,
  ResellerDashboard,
  ResellerLimits,
  ResellerUserLookup,
  SalesReport,
  TokenPair,
} from "@/lib/api/types";

export const resellerApi = {
  login(body: { login: string; password: string }) {
    return apiFetch<{ reseller: Reseller } & TokenPair>("/reseller/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body),
    });
  },

  forgotPassword(login: string) {
    return apiFetch<{ sent: true; expiresInSeconds: number }>(
      "/reseller/auth/forgot-password",
      {
        method: "POST",
        auth: false,
        body: JSON.stringify({ login }),
      },
    );
  },

  verifyOtp(login: string, otp: string) {
    return apiFetch<{ valid: true }>("/reseller/auth/verify-otp", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ login, otp }),
    });
  },

  resetPassword(login: string, otp: string, newPassword: string) {
    return apiFetch<{ reset: true }>("/reseller/auth/reset-password", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ login, otp, newPassword }),
    });
  },

  me() {
    return apiFetch<Reseller>("/reseller/auth/me", { portal: "reseller" });
  },

  dashboard() {
    return apiFetch<ResellerDashboard>("/reseller/dashboard", {
      portal: "reseller",
    });
  },

  limits() {
    return apiFetch<ResellerLimits>("/reseller/limits", { portal: "reseller" });
  },

  catalog(query: { type?: CatalogType; page?: number; limit?: number }) {
    return apiFetch<Paginated<CatalogItem>>("/reseller/catalog", {
      portal: "reseller",
      query,
    });
  },

  lookupUser(publicId: string) {
    return apiFetch<ResellerUserLookup>(`/reseller/users/${publicId}`, {
      portal: "reseller",
    });
  },

  transferCoins(body: {
    publicId: string;
    amount: number;
    idempotencyKey: string;
  }) {
    return apiFetch<{
      user: { id: string; publicId: string; username: string };
      debit: unknown;
      credit: unknown;
    }>("/reseller/coins/transfer", {
      method: "POST",
      portal: "reseller",
      body: JSON.stringify(body),
    });
  },

  assignFrame(body: {
    publicId: string;
    catalogItemId: string;
    duration: AssignDuration;
    customDays?: number;
  }) {
    return apiFetch<AssignedItem>("/reseller/frames/assign", {
      method: "POST",
      portal: "reseller",
      body: JSON.stringify(body),
    });
  },

  assignEntry(body: {
    publicId: string;
    catalogItemId: string;
    duration: AssignDuration;
    customDays?: number;
  }) {
    return apiFetch<AssignedItem>("/reseller/entries/assign", {
      method: "POST",
      portal: "reseller",
      body: JSON.stringify(body),
    });
  },

  assignBadge(body: {
    publicId: string;
    catalogItemId: string;
    duration: AssignDuration;
    customDays?: number;
  }) {
    return apiFetch<AssignedItem>("/reseller/badges/assign", {
      method: "POST",
      portal: "reseller",
      body: JSON.stringify(body),
    });
  },

  removeItem(id: string) {
    return apiFetch<AssignedItem>(`/reseller/items/${id}`, {
      method: "DELETE",
      portal: "reseller",
    });
  },

  transactions(query: { page?: number; limit?: number }) {
    return apiFetch<Paginated<Record<string, unknown>>>("/reseller/transactions", {
      portal: "reseller",
      query,
    });
  },

  salesReport(query: { from?: string; to?: string }) {
    return apiFetch<SalesReport>("/reseller/reports/sales", {
      portal: "reseller",
      query,
    });
  },

  commissionReport(query: { from?: string; to?: string }) {
    return apiFetch<SalesReport>("/reseller/reports/commission", {
      portal: "reseller",
      query,
    });
  },
};
