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
import type { ConsumerUser, PaginationMeta, UserStatus } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const { error } = useToast();
  const [items, setItems] = useState<ConsumerUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi
      .listUsers({ page, limit: 20, search, status })
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
        title="Users"
        description="Consumer accounts. Public ID is required for reseller transfers."
        action={
          <Link href="/admin/users/new">
            <Button>Create user</Button>
          </Link>
        }
      />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="Search"
            placeholder="Username, email…"
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
              setStatus(e.target.value as UserStatus | "");
            }}
            options={[
              { value: "", label: "All" },
              { value: "active", label: "Active" },
              { value: "banned", label: "Banned" },
            ]}
          />
        </div>
      </Card>
      {loading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">Public ID</th>
                  <th className="px-2 py-2 font-medium">User</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Created</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-b border-border/60">
                    <td className="px-2 py-3 font-mono text-primary">{u.publicId}</td>
                    <td className="px-2 py-3">
                      <div className="font-medium">{u.displayName}</div>
                      <div className="text-xs text-muted-foreground">@{u.username}</div>
                    </td>
                    <td className="px-2 py-3">
                      <Badge tone={u.status === "banned" ? "danger" : "success"}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Link href={`/admin/users/${u.id}`}>
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
