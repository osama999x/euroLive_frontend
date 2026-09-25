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
import type { Agency, AgencyStatus, PaginationMeta } from "@/lib/api/types";
import { formatDate, isNotFoundError } from "@/lib/utils";

function AgenciesList() {
  const { error, success, toast } = useToast();
  const [items, setItems] = useState<Agency[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState<AgencyStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: "",
    username: "",
    displayName: "",
    country: "PK",
    password: "",
    sharePercent: "10",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listAgencies({
        page,
        limit: 20,
        country: country || undefined,
        status: status || undefined,
      });
      setItems(res.items);
      setMeta(res.meta);
    } catch (err) {
      if (isNotFoundError(err)) toast("Agencies API not available yet");
      else error(err);
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, country, status, error, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.createAgency({
        email: form.email,
        username: form.username,
        displayName: form.displayName,
        country: form.country,
        password: form.password,
        sharePercent: Number.parseFloat(form.sharePercent),
      });
      success("Agency created");
      setCreateOpen(false);
      setForm({
        email: "",
        username: "",
        displayName: "",
        country: "PK",
        password: "",
        sharePercent: "10",
      });
      void load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-list">
      <PageHeader
        title="Agencies"
        description="Partner agencies and revenue share."
        action={
          <Button className="btn-press" onClick={() => setCreateOpen(true)}>
            Create agency
          </Button>
        }
      />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
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
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as AgencyStatus | "");
            }}
            options={[
              { value: "", label: "All" },
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
              { value: "frozen", label: "Frozen" },
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
        <LoadingBlock label="Loading agencies…" />
      ) : items.length === 0 ? (
        <EmptyState title="No agencies found" />
      ) : (
        <Card>
          <div className="portal-table-scroll">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">Agency</th>
                  <th className="px-2 py-2 font-medium">Country</th>
                  <th className="px-2 py-2 font-medium">Share</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Created</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-b border-border/60">
                    <td className="px-2 py-3">
                      <div className="font-medium">{a.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.email} · @{a.username}
                      </div>
                    </td>
                    <td className="px-2 py-3">{a.country}</td>
                    <td className="px-2 py-3">{a.sharePercent ?? "—"}%</td>
                    <td className="px-2 py-3">
                      <Badge
                        tone={
                          a.status === "active"
                            ? "success"
                            : a.status === "frozen"
                              ? "danger"
                              : "default"
                        }
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {formatDate(a.createdAt)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Link href={`/admin/agencies/${a.id}`}>
                        <Button size="sm" variant="secondary" className="btn-press">
                          Open
                        </Button>
                      </Link>
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create agency">
        <form onSubmit={onCreate} className="space-y-3">
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
          <Input
            label="Display name"
            required
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
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
          <Input
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Input
            label="Share %"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={form.sharePercent}
            onChange={(e) => setForm({ ...form, sharePercent: e.target.value })}
          />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Creating…" : "Create"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

export default function AdminAgenciesPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading agencies…" />}>
      <AgenciesList />
    </Suspense>
  );
}
