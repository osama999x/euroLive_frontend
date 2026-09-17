"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Pagination } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { AccountStatus, PaginationMeta, Reseller } from "@/lib/api/types";
import { cn, formatDate } from "@/lib/utils";

function ResellersList() {
  const { error } = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const refreshToken = searchParams.get("r") ?? "";
  const highlight = searchParams.get("highlight") ?? "";

  const [items, setItems] = useState<Reseller[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AccountStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [focusTick, setFocusTick] = useState(0);

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listResellers({ page, limit: 20, search, status });
      setItems(res.items);
      setMeta(res.meta);
    } catch (err) {
      error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, error]);

  useEffect(() => {
    if (refreshToken) setPage(1);
  }, [refreshToken]);

  useEffect(() => {
    void load();
  }, [load, pathname, refreshToken, focusTick]);

  useEffect(() => {
    if (!highlight) return;
    const t = window.setTimeout(() => {
      router.replace("/admin/resellers", { scroll: false });
    }, 2800);
    return () => window.clearTimeout(t);
  }, [highlight, router]);

  return (
    <div className="portal-list">
      <PageHeader
        title="Resellers"
        description="Create resellers, set permissions, and top up coin balances."
        action={
          <Link href="/admin/resellers/new">
            <Button className="btn-press">Create reseller</Button>
          </Link>
        }
      />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Search"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as AccountStatus | "");
            }}
            options={[
              { value: "", label: "All" },
              { value: "active", label: "Active" },
              { value: "disabled", label: "Disabled" },
              { value: "banned", label: "Banned" },
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
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        </div>
      </Card>
      {loading ? (
        <LoadingBlock label="Loading resellers…" />
      ) : items.length === 0 ? (
        <EmptyState title="No resellers yet" />
      ) : (
        <Card>
          <div className="portal-table-scroll">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">Reseller</th>
                  <th className="px-2 py-2 font-medium">Credit limit</th>
                  <th className="px-2 py-2 font-medium">Commission</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Created</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {items.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                    className={cn(
                      "portal-row border-b border-border/60 transition hover:bg-primary/5",
                      highlight === r.id && "portal-row-highlight",
                    )}
                  >
                    <td className="px-2 py-3">
                      <div className="font-medium">{r.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.email} · @{r.username}
                      </div>
                    </td>
                    <td className="px-2 py-3">{r.creditLimit}</td>
                    <td className="px-2 py-3">{r.commissionRate}%</td>
                    <td className="px-2 py-3">
                      <Badge
                        tone={
                          r.status === "active"
                            ? "success"
                            : r.status === "banned"
                              ? "danger"
                              : "default"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Link href={`/admin/resellers/${r.id}`}>
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
    </div>
  );
}

export default function AdminResellersPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading resellers…" />}>
      <ResellersList />
    </Suspense>
  );
}
