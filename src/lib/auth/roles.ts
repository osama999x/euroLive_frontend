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

export function filterAdminNav(roles: StaffRole[] | undefined) {
  return ADMIN_NAV.filter((item) => staffHasRole(roles, item.roles));
}
