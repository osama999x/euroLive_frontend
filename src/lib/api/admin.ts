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
      body: JSON.stringify({ code: code.replace(/\D/g, "").slice(0, 6) }),
    });
  },

  disable2fa(code: string) {
    return apiFetch<unknown>("/admin/auth/2fa/disable", {
      method: "POST",
      portal: "admin",
      body: JSON.stringify({ code: code.replace(/\D/g, "").slice(0, 6) }),
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

  /** Legacy permanent ID ban — prefer createUserBan */
  banUser(id: string) {
    return apiFetch<ConsumerUser>(`/admin/users/${id}/ban`, {
      method: "PATCH",
      portal: "admin",
    });
  },

  /** Lift all active ID bans */
  unbanUser(id: string) {
    return apiFetch<ConsumerUser>(`/admin/users/${id}/unban`, {
      method: "PATCH",
      portal: "admin",
    });
  },

  listUserDevices(id: string) {
    return apiFetch<
      | import("@/lib/api/types").UserDeviceRecord[]
      | { items: import("@/lib/api/types").UserDeviceRecord[] }
    >(`/admin/users/${id}/devices`, { portal: "admin" });
  },

  listUserBans(id: string) {
    return apiFetch<
      | import("@/lib/api/types").UserBanRecord[]
      | { items: import("@/lib/api/types").UserBanRecord[] }
    >(`/admin/users/${id}/bans`, { portal: "admin" });
  },

  createUserBan(
    id: string,
    body: import("@/lib/api/types").CreateUserBanBody,
  ) {
    return apiFetch<{
      bans: import("@/lib/api/types").UserBanRecord[];
      user: ConsumerUser;
    }>(`/admin/users/${id}/bans`, {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  revokeUserBan(userId: string, banId: string) {
    return apiFetch<unknown>(`/admin/users/${userId}/bans/${banId}/revoke`, {
      method: "POST",
      portal: "admin",
      body: JSON.stringify({}),
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

  // —— Euro Live Core ——
  setUserOfficial(
    id: string,
    body: { isOfficial: boolean; officialId?: string },
  ) {
    return apiFetch<ConsumerUser>(`/admin/users/${id}/official`, {
      method: "PATCH",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  listAgencies(query: {
    page?: number;
    limit?: number;
    country?: string;
    status?: string;
  }) {
    return apiFetch<Paginated<import("@/lib/api/types").Agency>>(
      "/admin/agencies",
      { portal: "admin", query },
    );
  },

  createAgency(body: Record<string, unknown>) {
    return apiFetch<import("@/lib/api/types").Agency>("/admin/agencies", {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  getAgency(id: string) {
    return apiFetch<import("@/lib/api/types").Agency>(`/admin/agencies/${id}`, {
      portal: "admin",
    });
  },

  updateAgency(id: string, body: Record<string, unknown>) {
    return apiFetch<import("@/lib/api/types").Agency>(`/admin/agencies/${id}`, {
      method: "PATCH",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  freezeAgency(id: string, reason: string) {
    return apiFetch<unknown>(`/admin/agencies/${id}/freeze`, {
      method: "POST",
      portal: "admin",
      body: JSON.stringify({ reason }),
    });
  },

  unfreezeAgency(id: string) {
    return apiFetch<import("@/lib/api/types").Agency>(
      `/admin/agencies/${id}/unfreeze`,
      { method: "POST", portal: "admin" },
    );
  },

  listHosts(query: { page?: number; limit?: number; agencyId?: string; country?: string }) {
    return apiFetch<Paginated<import("@/lib/api/types").HostProfile>>(
      "/admin/hosts",
      { portal: "admin", query },
    );
  },

  createHost(body: Record<string, unknown>) {
    return apiFetch<import("@/lib/api/types").HostProfile>("/admin/hosts", {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  getHost(id: string) {
    return apiFetch<import("@/lib/api/types").HostProfile>(`/admin/hosts/${id}`, {
      portal: "admin",
    });
  },

  updateHost(id: string, body: Record<string, unknown>) {
    return apiFetch<import("@/lib/api/types").HostProfile>(`/admin/hosts/${id}`, {
      method: "PATCH",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  protectionLock(id: string, body: { reason: string; hours?: number }) {
    return apiFetch<unknown>(`/admin/hosts/${id}/protection-lock`, {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  protectionUnlock(id: string) {
    return apiFetch<unknown>(`/admin/hosts/${id}/protection-unlock`, {
      method: "POST",
      portal: "admin",
    });
  },

  freezeHost(id: string, reason: string) {
    return apiFetch<unknown>(`/admin/hosts/${id}/freeze`, {
      method: "POST",
      portal: "admin",
      body: JSON.stringify({ reason }),
    });
  },

  unfreezeHost(id: string) {
    return apiFetch<import("@/lib/api/types").HostProfile>(
      `/admin/hosts/${id}/unfreeze`,
      { method: "POST", portal: "admin" },
    );
  },

  banHostLive(id: string) {
    return apiFetch<import("@/lib/api/types").HostProfile & { alreadyBanned?: boolean }>(
      `/admin/hosts/${id}/live-ban`,
      { method: "POST", portal: "admin" },
    );
  },

  unbanHostLive(id: string) {
    return apiFetch<import("@/lib/api/types").HostProfile & { alreadyClear?: boolean }>(
      `/admin/hosts/${id}/live-unban`,
      { method: "POST", portal: "admin" },
    );
  },

  postHostHours(
    id: string,
    body: { periodId: string; liveHours: number; liveDays: number; beans?: number },
  ) {
    return apiFetch<unknown>(`/admin/hosts/${id}/hours`, {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  listRooms(query: { page?: number; limit?: number } = {}) {
    return apiFetch<Paginated<import("@/lib/api/types").LiveRoom> | import("@/lib/api/types").LiveRoom[]>(
      "/admin/rooms",
      { portal: "admin", query },
    );
  },

  listComplaints(query: { page?: number; limit?: number; status?: string } = {}) {
    return apiFetch<
      Paginated<import("@/lib/api/types").Complaint> | import("@/lib/api/types").Complaint[]
    >("/admin/complaints", { portal: "admin", query });
  },

  getComplaint(id: string) {
    return apiFetch<import("@/lib/api/types").Complaint>(
      `/admin/complaints/${id}`,
      { portal: "admin" },
    );
  },

  reviewComplaint(
    id: string,
    body: {
      action: "confirm" | "reject" | "close";
      note?: string;
      penalty?: string;
      salaryDeduct?: boolean;
    },
  ) {
    return apiFetch<unknown>(`/admin/complaints/${id}/review`, {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  listSos(query: { page?: number; limit?: number; status?: string } = {}) {
    return apiFetch<
      Paginated<import("@/lib/api/types").SosAlert> | import("@/lib/api/types").SosAlert[]
    >("/admin/sos", { portal: "admin", query });
  },

  ackSos(id: string) {
    return apiFetch<unknown>(`/admin/sos/${id}/ack`, {
      method: "POST",
      portal: "admin",
    });
  },

  resolveSos(id: string, outcome: string) {
    return apiFetch<unknown>(`/admin/sos/${id}/resolve`, {
      method: "POST",
      portal: "admin",
      body: JSON.stringify({ outcome }),
    });
  },

  listCountries() {
    return apiFetch<import("@/lib/api/types").CountryRule[]>(
      "/admin/countries",
      { portal: "admin" },
    );
  },

  updateCountry(code: string, body: Record<string, unknown>) {
    return apiFetch<import("@/lib/api/types").CountryRule>(
      `/admin/countries/${code}`,
      {
        method: "PATCH",
        portal: "admin",
        body: JSON.stringify(body),
      },
    );
  },

  listSalaryRules(query: { countryCode?: string } = {}) {
    return apiFetch<import("@/lib/api/types").SalaryRule[]>(
      "/admin/salary-rules",
      { portal: "admin", query },
    );
  },

  createSalaryRule(body: Record<string, unknown>) {
    return apiFetch<import("@/lib/api/types").SalaryRule>(
      "/admin/salary-rules",
      {
        method: "POST",
        portal: "admin",
        body: JSON.stringify(body),
      },
    );
  },

  updateSalaryRule(id: string, body: Record<string, unknown>) {
    return apiFetch<import("@/lib/api/types").SalaryRule>(
      `/admin/salary-rules/${id}`,
      {
        method: "PATCH",
        portal: "admin",
        body: JSON.stringify(body),
      },
    );
  },

  listSalaryPeriods() {
    return apiFetch<import("@/lib/api/types").SalaryPeriod[]>(
      "/admin/salary/periods",
      { portal: "admin" },
    );
  },

  createSalaryPeriod(body: {
    label: string;
    startsOn: string;
    endsOn: string;
  }) {
    return apiFetch<import("@/lib/api/types").SalaryPeriod>(
      "/admin/salary/periods",
      {
        method: "POST",
        portal: "admin",
        body: JSON.stringify(body),
      },
    );
  },

  listPayouts() {
    return apiFetch<
      Paginated<import("@/lib/api/types").PayoutBatch> | import("@/lib/api/types").PayoutBatch[]
    >("/admin/payouts", { portal: "admin" });
  },

  getPayout(id: string) {
    return apiFetch<import("@/lib/api/types").PayoutBatch>(
      `/admin/payouts/${id}`,
      { portal: "admin" },
    );
  },

  calculatePayout(periodId: string) {
    return apiFetch<import("@/lib/api/types").PayoutBatch>(
      "/admin/payouts/calculate",
      {
        method: "POST",
        portal: "admin",
        body: JSON.stringify({ periodId }),
      },
    );
  },

  approvePayoutHold(id: string) {
    return apiFetch<import("@/lib/api/types").PayoutBatch>(
      `/admin/payouts/${id}/approve-hold`,
      { method: "POST", portal: "admin" },
    );
  },

  correctPayoutItem(
    payoutId: string,
    itemId: string,
    body: { newAmount: number; reason: string },
  ) {
    return apiFetch<unknown>(`/admin/payouts/${payoutId}/items/${itemId}/correct`, {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  releasePayout(id: string) {
    return apiFetch<import("@/lib/api/types").PayoutBatch>(
      `/admin/payouts/${id}/release`,
      { method: "POST", portal: "admin" },
    );
  },

  listFreezes(query: { status?: string; ownerId?: string } = {}) {
    return apiFetch<
      Paginated<import("@/lib/api/types").FreezeCase> | import("@/lib/api/types").FreezeCase[]
    >("/admin/freezes", { portal: "admin", query });
  },

  createFreeze(body: {
    ownerId: string;
    ownerType: string;
    freezeType: "coins" | "account" | "wallet";
    reason: string;
  }) {
    return apiFetch<import("@/lib/api/types").FreezeCase>("/admin/freezes", {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  reviewFreeze(
    id: string,
    body: { action: "restore" | "confirm" | "ban"; note?: string },
  ) {
    return apiFetch<unknown>(`/admin/freezes/${id}/review`, {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  listFraud() {
    return apiFetch<
      Paginated<import("@/lib/api/types").FraudCase> | import("@/lib/api/types").FraudCase[]
    >("/admin/fraud", { portal: "admin" });
  },

  reviewFraud(
    id: string,
    body: {
      action: "restore" | "correct" | "penalty" | "ban";
      note?: string;
      amount?: number;
    },
  ) {
    return apiFetch<unknown>(`/admin/fraud/${id}/review`, {
      method: "POST",
      portal: "admin",
      body: JSON.stringify(body),
    });
  },

  backupSettings() {
    return apiFetch<import("@/lib/api/types").BackupSettings>(
      "/admin/backups/settings",
      { portal: "admin" },
    );
  },

  updateBackupSettings(body: Record<string, unknown>) {
    return apiFetch<import("@/lib/api/types").BackupSettings>(
      "/admin/backups/settings",
      {
        method: "PATCH",
        portal: "admin",
        body: JSON.stringify(body),
      },
    );
  },

  runBackup() {
    return apiFetch<import("@/lib/api/types").BackupRun>("/admin/backups/run", {
      method: "POST",
      portal: "admin",
    });
  },

  listBackups() {
    return apiFetch<
      Paginated<import("@/lib/api/types").BackupRun> | import("@/lib/api/types").BackupRun[]
    >("/admin/backups", { portal: "admin" });
  },
};

export type { TokenPair };
