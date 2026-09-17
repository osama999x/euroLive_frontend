import { apiFetch } from "@/lib/api/client";
import type {
  AdminDashboard,
  AdminLoginResult,
  AuditLog,
  CatalogItem,
  CatalogType,
  ConsumerUser,
  LedgerDirection,
  Paginated,
  Reseller,
  ResellerPermissions,
  RoleCatalogItem,
  Staff,
  StaffRole,
  TokenPair,
  UserStatus,
  AccountStatus,
  WalletCurrency,
  WalletOwnerType,
} from "@/lib/api/types";

export const adminApi = {
  login(body: { login: string; password: string }) {
    return apiFetch<AdminLoginResult>("/admin/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body),
    });
  },

  forgotPassword(login: string) {
    return apiFetch<{ sent: true; expiresInSeconds: number }>(
      "/admin/auth/forgot-password",
      {
        method: "POST",
        auth: false,
        body: JSON.stringify({ login }),
      },
    );
  },

  verifyOtp(login: string, otp: string) {
    return apiFetch<{ valid: true }>("/admin/auth/verify-otp", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ login, otp }),
    });
  },

  resetPassword(login: string, otp: string, newPassword: string) {
    return apiFetch<{ reset: true }>("/admin/auth/reset-password", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ login, otp, newPassword }),
    });
  },

  verify2fa(body: { challengeToken: string; code: string }) {
    return apiFetch<Extract<AdminLoginResult, { requires2fa: false }>>(
      "/admin/auth/2fa/verify",
      {
        method: "POST",
        auth: false,
        body: JSON.stringify(body),
      },
    );
  },

  me() {
    return apiFetch<Staff>("/admin/auth/me", { portal: "admin" });
  },

  setup2fa() {
    return apiFetch<{ secret: string; otpauthUrl: string }>(
      "/admin/auth/2fa/setup",
      { method: "POST", portal: "admin" },
    );
  },

  enable2fa(code: string) {
    return apiFetch<unknown>("/admin/auth/2fa/enable", {
      method: "POST",
      portal: "admin",
      body: JSON.stringify({ code }),
    });
  },

  disable2fa(code: string) {
    return apiFetch<unknown>("/admin/auth/2fa/disable", {
      method: "POST",
      portal: "admin",
      body: JSON.stringify({ code }),
    });
  },

  dashboard() {
    return apiFetch<AdminDashboard>("/admin/dashboard", { portal: "admin" });
  },

  listUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus | "";
  }) {
    return apiFetch<Paginated<ConsumerUser>>("/admin/users", {
      portal: "admin",
      query,
    });
  },

  createUser(body: {
    username: string;
    displayName: string;
    email?: string;
    phone?: string;
    country?: string;
  }) {
    return apiFetch<ConsumerUser>("/admin/users", {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  getUser(id: string) {
    return apiFetch<ConsumerUser>(`/admin/users/${id}`, { portal: "admin" });
  },

  banUser(id: string) {
    return apiFetch<ConsumerUser>(`/admin/users/${id}/ban`, {
      method: "PATCH",
      portal: "admin",
    });
  },

  unbanUser(id: string) {
    return apiFetch<ConsumerUser>(`/admin/users/${id}/unban`, {
      method: "PATCH",
      portal: "admin",
    });
  },

  listResellers(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: AccountStatus | "";
  }) {
    return apiFetch<Paginated<Reseller>>("/admin/resellers", {
      portal: "admin",
      query,
    });
  },

  createReseller(body: Record<string, unknown>) {
    return apiFetch<Reseller>("/admin/resellers", {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  getReseller(id: string) {
    return apiFetch<Reseller>(`/admin/resellers/${id}`, { portal: "admin" });
  },

  updateReseller(
    id: string,
    body: { email?: string; displayName?: string; status?: AccountStatus },
  ) {
    return apiFetch<Reseller>(`/admin/resellers/${id}`, {
      method: "PATCH",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  adjustResellerBalance(
    id: string,
    body: {
      direction: LedgerDirection;
      amount: number;
      note?: string;
      idempotencyKey?: string;
    },
  ) {
    return apiFetch<{ reseller: Reseller; ledger: unknown }>(
      `/admin/resellers/${id}/balance`,
      {
        method: "PATCH",
        portal: "admin",
        body: JSON.stringify(body),
      },
    );
  },

  updateResellerPermissions(id: string, body: Partial<ResellerPermissions>) {
    return apiFetch<Reseller>(`/admin/resellers/${id}/permissions`, {
      method: "PATCH",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  updateResellerLimits(
    id: string,
    body: Partial<
      Pick<
        ResellerPermissions,
        | "dailyRechargeLimit"
        | "dailyFrameLimit"
        | "dailyEntryLimit"
        | "dailyBadgeLimit"
      >
    >,
  ) {
    return apiFetch<Reseller>(`/admin/resellers/${id}/limits`, {
      method: "PATCH",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  updateResellerCreditLimit(id: string, creditLimit: number) {
    return apiFetch<Reseller>(`/admin/resellers/${id}/credit-limit`, {
      method: "PATCH",
      portal: "admin",
      body: JSON.stringify({ creditLimit }),
    });
  },

  listCatalog(query: {
    page?: number;
    limit?: number;
    type?: CatalogType | "";
  }) {
    return apiFetch<Paginated<CatalogItem>>("/admin/catalog", {
      portal: "admin",
      query,
    });
  },

  getCatalogItem(id: string) {
    return apiFetch<CatalogItem>(`/admin/catalog/${id}`, { portal: "admin" });
  },

  createCatalogItem(body: Partial<CatalogItem> & { type: CatalogType; name: string; assetUrl: string; price: number }) {
    return apiFetch<CatalogItem>("/admin/catalog", {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  updateCatalogItem(id: string, body: Partial<CatalogItem>) {
    return apiFetch<CatalogItem>(`/admin/catalog/${id}`, {
      method: "PATCH",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  deleteCatalogItem(id: string) {
    return apiFetch<{ deleted: boolean }>(`/admin/catalog/${id}`, {
      method: "DELETE",
      portal: "admin",
    });
  },

  adjustWallet(body: {
    ownerType: WalletOwnerType;
    ownerId: string;
    currency: WalletCurrency;
    direction: LedgerDirection;
    amount: number;
    note?: string;
    idempotencyKey?: string;
  }) {
    return apiFetch<unknown>("/admin/wallets/adjust", {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  listRoles() {
    return apiFetch<RoleCatalogItem[]>("/admin/roles", { portal: "admin" });
  },

  listPermissions() {
    return apiFetch<unknown[]>("/admin/permissions", { portal: "admin" });
  },

  listStaff() {
    return apiFetch<Staff[]>("/admin/staff", { portal: "admin" });
  },

  createStaff(body: {
    email: string;
    username: string;
    password: string;
    roleSlugs: StaffRole[];
  }) {
    return apiFetch<Staff>("/admin/staff", {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  updateStaffRoles(id: string, roleSlugs: StaffRole[]) {
    return apiFetch<Staff>(`/admin/staff/${id}/roles`, {
      method: "PATCH",
      portal: "admin",
      body: JSON.stringify({ roleSlugs }),
    });
  },

  listAuditLogs(query: {
    page?: number;
    limit?: number;
    action?: string;
    actorId?: string;
  }) {
    return apiFetch<Paginated<AuditLog>>("/admin/audit-logs", {
      portal: "admin",
      query,
    });
  },
};

export type { TokenPair };
