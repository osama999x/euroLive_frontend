"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { Staff, StaffRole } from "@/lib/api/types";
import { useAdminAuth } from "@/lib/auth/admin-store";
import { staffHasRole } from "@/lib/auth/roles";
import { formatDate } from "@/lib/utils";
import { PasswordInput } from "@/components/ui/password-input";

const ROLE_OPTIONS: StaffRole[] = [
  "super_admin",
  "admin",
  "finance",
  "support",
  "moderator",
];

export default function AdminStaffPage() {
  const { staff: me } = useAdminAuth();
  const { error, success } = useToast();
  const pathname = usePathname();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [roleModal, setRoleModal] = useState<Staff | null>(null);
  const [busy, setBusy] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    role: "support" as StaffRole,
  });
  const [roleSlug, setRoleSlug] = useState<StaffRole>("support");
  const [focusTick, setFocusTick] = useState(0);

  const allowed = staffHasRole(me?.roles ?? (me ? [me.role] : []), [
    "super_admin",
  ]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminApi.listStaff();
      setStaff(list);
    } catch (err) {
      error(err);
    } finally {
      setLoading(false);
    }
  }, [error]);

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

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    void reload();
  }, [allowed, reload, pathname, focusTick]);

  async function createStaff(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await adminApi.createStaff({
        email: form.email,
        username: form.username,
        password: form.password,
        roleSlugs: [form.role],
      });
      success("Staff created");
      setOpen(false);
      setForm({ email: "", username: "", password: "", role: "support" });
      setHighlightId(created.id);
      // Optimistic prepend, then hard refresh from API
      setStaff((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
      await reload();
      window.setTimeout(() => setHighlightId(null), 2800);
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function saveRoles(e: FormEvent) {
    e.preventDefault();
    if (!roleModal) return;
    setBusy(true);
    try {
      const updated = await adminApi.updateStaffRoles(roleModal.id, [roleSlug]);
      success("Roles updated");
      setRoleModal(null);
      setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      await reload();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  if (!allowed) {
    return (
      <EmptyState
        title="Super admin only"
        description="Staff & roles management requires the super_admin role."
      />
    );
  }

  return (
    <div className="portal-list">
      <PageHeader
        title="Staff & roles"
        description="Invite staff and assign role slugs."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="secondary"
              className="btn-press"
              onClick={() => void reload()}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button className="btn-press" onClick={() => setOpen(true)}>
              Create staff
            </Button>
          </div>
        }
      />
      {loading ? (
        <LoadingBlock label="Loading staff…" />
      ) : staff.length === 0 ? (
        <EmptyState title="No staff found" />
      ) : (
        <Card>
          <div className="portal-table-scroll">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">Staff</th>
                  <th className="px-2 py-2 font-medium">Roles</th>
                  <th className="px-2 py-2 font-medium">2FA</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Created</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {staff.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                    className={`portal-row border-b border-border/60 transition hover:bg-primary/5 ${
                      highlightId === s.id ? "portal-row-highlight" : ""
                    }`}
                  >
                    <td className="px-2 py-3">
                      <div className="font-medium">{s.username}</div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(s.roles?.length ? s.roles : [s.role]).map((r) => (
                          <Badge key={r} tone="gold">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {s.totpEnabled ? "On" : "Off"}
                    </td>
                    <td className="px-2 py-3">
                      <Badge
                        tone={s.status === "active" ? "success" : "danger"}
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="btn-press"
                        onClick={() => {
                          setRoleModal(s);
                          setRoleSlug(s.role);
                        }}
                      >
                        Roles
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create staff">
        <form onSubmit={createStaff} className="space-y-3">
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Username"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <PasswordInput
            label="Password"
            minLength={8}
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as StaffRole })
            }
            options={ROLE_OPTIONS.map((r) => ({ value: r, label: r }))}
          />
          <Button type="submit" disabled={busy} className="btn-press w-full">
            {busy ? "Creating…" : "Create"}
          </Button>
        </form>
      </Modal>

      <Modal
        open={Boolean(roleModal)}
        onClose={() => setRoleModal(null)}
        title={`Roles · ${roleModal?.username ?? ""}`}
      >
        <form onSubmit={saveRoles} className="space-y-3">
          <Select
            label="Role slug"
            value={roleSlug}
            onChange={(e) => setRoleSlug(e.target.value as StaffRole)}
            options={ROLE_OPTIONS.map((r) => ({ value: r, label: r }))}
          />
          <Button type="submit" disabled={busy} className="btn-press w-full">
            {busy ? "Saving…" : "Save roles"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
