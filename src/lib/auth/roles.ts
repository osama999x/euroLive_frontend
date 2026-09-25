import type { StaffRole } from "@/lib/api/types";

export type AdminNavItem = {
  href: string;
  label: string;
  roles: StaffRole[] | "all";
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", roles: "all" },
  {
    href: "/admin/users",
    label: "Users",
    roles: ["super_admin", "admin", "support", "moderator"],
  },
  {
    href: "/admin/hosts",
    label: "Hosts",
    roles: ["super_admin", "admin", "support"],
  },
  {
    href: "/admin/agencies",
    label: "Agencies",
    roles: ["super_admin", "admin", "finance"],
  },
  {
    href: "/admin/resellers",
    label: "Resellers",
    roles: ["super_admin", "admin", "finance"],
  },
  {
    href: "/admin/catalog",
    label: "Catalog",
    roles: ["super_admin", "admin"],
  },
  {
    href: "/admin/rooms",
    label: "Rooms",
    roles: ["super_admin", "admin", "moderator"],
  },
  {
    href: "/admin/complaints",
    label: "Complaints",
    roles: ["super_admin", "admin", "support", "moderator"],
  },
  {
    href: "/admin/sos",
    label: "SOS",
    roles: ["super_admin", "admin", "support", "moderator"],
  },
  {
    href: "/admin/salary",
    label: "Salary",
    roles: ["super_admin", "admin", "finance"],
  },
  {
    href: "/admin/payouts",
    label: "Payouts",
    roles: ["super_admin", "finance"],
  },
  {
    href: "/admin/freezes",
    label: "Freezes",
    roles: ["super_admin", "admin", "finance"],
  },
  {
    href: "/admin/fraud",
    label: "Fraud",
    roles: ["super_admin", "admin", "finance"],
  },
  {
    href: "/admin/backups",
    label: "Backups",
    roles: ["super_admin"],
  },
  {
    href: "/admin/wallets",
    label: "Wallets",
    roles: ["super_admin", "admin", "finance"],
  },
  {
    href: "/admin/staff",
    label: "Staff & roles",
    roles: ["super_admin"],
  },
  {
    href: "/admin/audit",
    label: "Audit",
    roles: ["super_admin", "admin"],
  },
  {
    href: "/admin/security",
    label: "Security",
    roles: "all",
  },
];

export function staffHasRole(
  roles: StaffRole[] | undefined,
  allowed: StaffRole[] | "all",
): boolean {
  if (allowed === "all") return true;
  if (!roles?.length) return false;
  if (roles.includes("super_admin")) return true;
  return allowed.some((r) => roles.includes(r));
}

export function isMaster(roles: StaffRole[] | undefined): boolean {
  return Boolean(roles?.includes("super_admin"));
}

export function filterAdminNav(roles: StaffRole[] | undefined) {
  return ADMIN_NAV.filter((item) => staffHasRole(roles, item.roles));
}
