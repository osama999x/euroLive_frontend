"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Pagination } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { AccountStatus, PaginationMeta, Reseller } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";

export default function AdminResellersPage() {
  const { error } = useToast();
  const [items, setItems] = useState<Reseller[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AccountStatus | "">("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi
      .listResellers({ page, limit: 20, search, status })
      .then((res) => {
        setItems(res.items);
        setMeta(res.meta);
      })
      .catch((err) => error(err))
      .finally(() => setLoading(false));
  }, [page, search, status, error]);

  return (
    <div>
      <PageHeader
        title="Resellers"
        description="Create resellers, set permissions, and top up coin balances."
        action={
          <Link href="/admin/resellers/new">
            <Button>Create reseller</Button>
          </Link>
        }
      />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
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
        </div>
      </Card>
      {loading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState title="No resellers yet" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
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
                {items.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
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
                        <Button size="sm" variant="secondary">
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
