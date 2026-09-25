import { apiFetch } from "@/lib/api/client";
import type {
  Agency,
  AgencyDashboard,
  AgencyShareItem,
  HostProfile,
  Paginated,
  TokenPair,
} from "@/lib/api/types";

export const agencyApi = {
  login(body: { login: string; password: string }) {
    return apiFetch<{ agency: Agency } & TokenPair>("/agency/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body),
    });
  },

  me() {
    return apiFetch<Agency>("/agency/auth/me", { portal: "agency" });
  },

  dashboard() {
    return apiFetch<AgencyDashboard>("/agency/dashboard", { portal: "agency" });
  },

  hosts(query: { page?: number; limit?: number } = {}) {
    return apiFetch<Paginated<HostProfile>>("/agency/hosts", {
      portal: "agency",
      query,
    });
  },

  shares() {
    return apiFetch<{
      wallet: { coinBalance: number };
      shareTotal: number;
      items: AgencyShareItem[];
    }>("/agency/shares", { portal: "agency" });
  },
};
