"use client";

import Link from "next/link";
import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Modal, Pagination } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { HostProfile, PaginationMeta } from "@/lib/api/types";
import { useAdminAuth } from "@/lib/auth/admin-store";
import { isMaster, staffHasRole } from "@/lib/auth/roles";
import { isNotFoundError } from "@/lib/utils";

function HostsList() {
  const { staff } = useAdminAuth();
  const master = isMaster(staff?.roles);
  const canModerate = staffHasRole(staff?.roles, ["admin", "moderator"]);
  const { error, success, toast } = useToast();
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [items, setItems] = useState<HostProfile[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [agencyId, setAgencyId] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [form, setForm] = useState({
    userId: "",
    username: "",
    displayName: "",
    password: "",
    country: "PK",
    agencyId: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listHosts({
        page,
        limit: 20,
        agencyId: agencyId || undefined,
        country: country || undefined,
      });
      setItems(res.items);
      setMeta(res.meta);
    } catch (err) {
      if (isNotFoundError(err)) toast("Hosts API not available yet");
      else error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, agencyId, country, error, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runRow(
    id: string,
    action: () => Promise<
      { alreadyBanned?: boolean; alreadyClear?: boolean } | HostProfile | void
    >,
    ok: string,
  ) {
    setRowBusy(id);
    try {
      const result = await action();
      if (result && "alreadyBanned" in result && result.alreadyBanned) {
        success("Already banned from live");
      } else if (result && "alreadyClear" in result && result.alreadyClear) {
        success("Live access is already open");
      } else {
        success(ok);
      }
      await load();
    } catch (err) {
      error(err);
    } finally {
      setRowBusy(null);
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body: Record<string, unknown> =
        mode === "existing"
          ? { userId: form.userId.trim() }
          : {
              username: form.username.trim(),
              displayName: form.displayName.trim(),
              password: form.password,
              country: form.country,
            };
      if (form.agencyId.trim()) body.agencyId = form.agencyId.trim();
      const created = await adminApi.createHost(body);
      success("Host created");
      setCreateOpen(false);
      window.location.href = `/admin/hosts/${created.id}`;
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-list">
      <PageHeader
        title="Hosts"
        description="Live hosts linked to consumer users and agencies."
        action={
          <Button className="btn-press" onClick={() => setCreateOpen(true)}>
            Create host
          </Button>
        }
      />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="Agency ID"
            placeholder="UUID filter"
            value={agencyId}
            onChange={(e) => {
              setPage(1);
              setAgencyId(e.target.value);
            }}
          />
          <Select
            label="Country"
            value={country}
            onChange={(e) => {
              setPage(1);
              setCountry(e.target.value);
            }}
            options={[
              { value: "", label: "All" },
              { value: "PK", label: "PK" },
              { value: "IN", label: "IN" },
              { value: "BD", label: "BD" },
            ]}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              className="btn-press w-full"
              onClick={() => void load()}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>
      {loading ? (
        <LoadingBlock label="Loading hosts…" />
      ) : items.length === 0 ? (
        <EmptyState title="No hosts found" />
      ) : (
        <Card>
          <ul className="space-y-3 md:hidden">
            {items.map((h) => (
              <li
                key={h.id}
                className="rounded-xl border border-border/70 bg-muted/20 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {h.user?.displayName ?? h.userId.slice(0, 8)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {h.user ? `@${h.user.username}` : h.userId}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {h.agency?.displayName ?? "No agency"} · {h.country}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone={h.status === "active" ? "success" : "danger"}>
                      {h.status}
                    </Badge>
                    <Badge tone={h.liveBanned ? "danger" : "success"}>
                      {h.liveBanned ? "Live banned" : "Live open"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canModerate ? (
                    <Button
                      size="sm"
                      variant="danger"
                      className="btn-press"
                      disabled={rowBusy === h.id || Boolean(h.liveBanned)}
                      onClick={() =>
                        void runRow(
                          h.id,
                          () => adminApi.banHostLive(h.id),
                          "Banned from going live",
                        )
                      }
                    >
                      Ban live
                    </Button>
                  ) : null}
                  {canModerate ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="btn-press"
                      disabled={rowBusy === h.id || !h.liveBanned}
                      onClick={() =>
                        void runRow(
                          h.id,
                          () => adminApi.unbanHostLive(h.id),
                          "Live ban lifted",
                        )
                      }
                    >
                      Unban
                    </Button>
                  ) : null}
                  {master && h.status === "frozen" ? (
                    <Button
                      size="sm"
                      variant="primary"
                      className="btn-press"
                      disabled={rowBusy === h.id}
                      onClick={() =>
                        void runRow(
                          h.id,
                          () => adminApi.unfreezeHost(h.id),
                          "Host unfrozen",
                        )
                      }
                    >
                      Unfreeze
                    </Button>
                  ) : null}
                  <Link href={`/admin/hosts/${h.id}`}>
                    <Button size="sm" variant="secondary" className="btn-press">
                      Open
                    </Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <div className="portal-table-scroll hidden md:block">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">Host</th>
                  <th className="px-2 py-2 font-medium">Agency</th>
                  <th className="px-2 py-2 font-medium">Country</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Live</th>
                  <th className="px-2 py-2 font-medium">Protection</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {items.map((h) => (
                  <tr key={h.id} className="border-b border-border/60">
                    <td className="px-2 py-3">
                      <div className="font-medium">
                        {h.user?.displayName ?? h.userId.slice(0, 8)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {h.user ? `@${h.user.username}` : h.userId}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {h.agency?.displayName ?? "—"}
                    </td>
                    <td className="px-2 py-3">{h.country}</td>
                    <td className="px-2 py-3">
                      <Badge tone={h.status === "active" ? "success" : "danger"}>
                        {h.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">
                      <Badge tone={h.liveBanned ? "danger" : "success"}>
                        {h.liveBanned ? "Banned" : "Open"}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">
                      {h.protectionLocked ? (
                        <Badge tone="gold">Locked</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {canModerate ? (
                          <Button
                            size="sm"
                            variant="danger"
                            className="btn-press"
                            disabled={rowBusy === h.id || Boolean(h.liveBanned)}
                            onClick={() =>
                              void runRow(
                                h.id,
                                () => adminApi.banHostLive(h.id),
                                "Banned from going live",
                              )
                            }
                          >
                            Ban live
                          </Button>
                        ) : null}
                        {canModerate ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="btn-press"
                            disabled={rowBusy === h.id || !h.liveBanned}
                            onClick={() =>
                              void runRow(
                                h.id,
                                () => adminApi.unbanHostLive(h.id),
                                "Live ban lifted",
                              )
                            }
                          >
                            Unban
                          </Button>
                        ) : null}
                        {master && h.status === "frozen" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="btn-press"
                            disabled={rowBusy === h.id}
                            onClick={() =>
                              void runRow(
                                h.id,
                                () => adminApi.unfreezeHost(h.id),
                                "Host unfrozen",
                              )
                            }
                          >
                            Unfreeze
                          </Button>
                        ) : null}
                        <Link href={`/admin/hosts/${h.id}`}>
                          <Button size="sm" variant="secondary" className="btn-press">
                            Open
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta ? (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              hasNextPage={meta.hasNextPage}
              hasPreviousPage={meta.hasPreviousPage}
              onPageChange={setPage}
            />
          ) : null}
        </Card>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create host">
        <form onSubmit={onCreate} className="space-y-3">
          <Select
            label="Mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as "existing" | "new")}
            options={[
              { value: "existing", label: "Link existing user (userId)" },
              { value: "new", label: "Create user + host" },
            ]}
          />
          {mode === "existing" ? (
            <Input
              label="User ID (UUID)"
              required
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
            />
          ) : (
            <>
              <Input
                label="Username"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
              <Input
                label="Display name"
                required
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              />
              <Input
                label="Password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <Select
                label="Country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                options={[
                  { value: "PK", label: "PK" },
                  { value: "IN", label: "IN" },
                  { value: "BD", label: "BD" },
                ]}
              />
            </>
          )}
          <Input
            label="Agency ID (optional)"
            value={form.agencyId}
            onChange={(e) => setForm({ ...form, agencyId: e.target.value })}
          />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Creating…" : "Create"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

export default function AdminHostsPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading hosts…" />}>
      <HostsList />
    </Suspense>
  );
}
