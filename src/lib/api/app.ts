import { apiFetch } from "@/lib/api/client";
import type {
  AppUser,
  Complaint,
  DeviceRecord,
  BlockedRoomUser,
  HostProfile,
  HostSalaryView,
  LiveRoom,
  SosAlert,
  TokenPair,
} from "@/lib/api/types";

export const appApi = {
  login(body: {
    login: string;
    password: string;
    deviceId?: string;
    deviceName?: string;
  }) {
    return apiFetch<{ user: AppUser } & TokenPair>("/app/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body),
    });
  },

  me() {
    return apiFetch<AppUser>("/app/auth/me", { portal: "app" });
  },

  devices() {
    return apiFetch<DeviceRecord[]>("/app/me/devices", { portal: "app" });
  },

  logoutAll() {
    return apiFetch<{ revoked: true }>("/app/me/logout-all", {
      method: "POST",
      portal: "app",
    });
  },

  freeze(reason: string) {
    return apiFetch<unknown>("/app/me/freeze", {
      method: "POST",
      portal: "app",
      body: JSON.stringify({ reason }),
    });
  },

  createReport(body: {
    targetId: string;
    targetType?: "user" | "host" | "agency";
    summary: string;
    severity?: "low" | "medium" | "high" | "critical";
    type?: "user_report" | "host_complaint" | "agency_misconduct";
    evidence?: { type: "image" | "audio" | "video"; url: string }[];
    protectionLock?: boolean;
  }) {
    return apiFetch<Complaint>("/app/reports", {
      method: "POST",
      portal: "app",
      body: JSON.stringify(body),
    });
  },

  muteRoomUser(roomId: string, body: { userId: string; reason?: string }) {
    return apiFetch<unknown>(`/app/rooms/${roomId}/mute`, {
      method: "POST",
      portal: "app",
      body: JSON.stringify(body),
    });
  },
};

export const hostApi = {
  dashboard() {
    return apiFetch<{ host: HostProfile; rooms: LiveRoom[] }>("/host/dashboard", {
      portal: "app",
    });
  },

  listRooms() {
    return apiFetch<LiveRoom[]>("/host/rooms", { portal: "app" });
  },

  createRoom(title: string) {
    return apiFetch<LiveRoom>("/host/rooms", {
      method: "POST",
      portal: "app",
      body: JSON.stringify({ title }),
    });
  },

  setBackground(roomId: string, catalogItemId: string) {
    return apiFetch<LiveRoom>(`/host/rooms/${roomId}/background`, {
      method: "POST",
      portal: "app",
      body: JSON.stringify({ catalogItemId }),
    });
  },

  addStaff(roomId: string, userId: string) {
    return apiFetch<unknown>(`/host/rooms/${roomId}/staff`, {
      method: "POST",
      portal: "app",
      body: JSON.stringify({ userId }),
    });
  },

  removeStaff(roomId: string, userId: string) {
    return apiFetch<unknown>(`/host/rooms/${roomId}/staff/${userId}`, {
      method: "DELETE",
      portal: "app",
    });
  },

  kick(roomId: string, body: { userId: string; reason?: string }) {
    return apiFetch<unknown>(`/host/rooms/${roomId}/kick`, {
      method: "POST",
      portal: "app",
      body: JSON.stringify(body),
    });
  },

  listBlacklist(roomId: string) {
    return apiFetch<BlockedRoomUser[]>(`/host/rooms/${roomId}/blacklist`, {
      portal: "app",
    });
  },

  blacklist(roomId: string, userId: string) {
    return apiFetch<BlockedRoomUser>(`/host/rooms/${roomId}/blacklist`, {
      method: "POST",
      portal: "app",
      body: JSON.stringify({ userId }),
    });
  },

  unblacklist(roomId: string, userId: string) {
    return apiFetch<{ removed: true; userId: string }>(
      `/host/rooms/${roomId}/blacklist/${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
        portal: "app",
      },
    );
  },

  createComplaint(body: Record<string, unknown>) {
    return apiFetch<Complaint>("/host/complaints", {
      method: "POST",
      portal: "app",
      body: JSON.stringify(body),
    });
  },

  listComplaints() {
    return apiFetch<Complaint[] | { items: Complaint[] }>("/host/complaints", {
      portal: "app",
    });
  },

  createSos(body: {
    roomId?: string;
    message?: string;
    assignedResellerId?: string;
  }) {
    return apiFetch<SosAlert>("/host/sos", {
      method: "POST",
      portal: "app",
      body: JSON.stringify(body),
    });
  },

  listSos() {
    return apiFetch<SosAlert[] | { items: SosAlert[] }>("/host/sos", {
      portal: "app",
    });
  },

  setSalaryPin(body: { pin: string; currentPin?: string }) {
    return apiFetch<unknown>("/host/salary/pin", {
      method: "POST",
      portal: "app",
      body: JSON.stringify(body),
    });
  },

  viewSalary(pin: string) {
    return apiFetch<HostSalaryView>("/host/salary/view", {
      method: "POST",
      portal: "app",
      body: JSON.stringify({ pin }),
    });
  },

  forgotSalaryPin() {
    return apiFetch<{ sent: true; expiresInSeconds: number }>(
      "/host/salary/pin/forgot",
      { method: "POST", portal: "app" },
    );
  },

  resetSalaryPin(body: { otp: string; pin: string }) {
    return apiFetch<unknown>("/host/salary/pin/reset", {
      method: "POST",
      portal: "app",
      body: JSON.stringify(body),
    });
  },
};
