"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { AuditLog, PaginationMeta } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";

export default function AdminAuditPage() {
  const { error } = useToast();
  const [items, setItems] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [actorId, setActorId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi
      .listAuditLogs({
        page,
        limit: 20,
        action: action || undefined,
        actorId: actorId || undefined,
      })
      .then((res) => {
        setItems(res.items);
        setMeta(res.meta);
      })
      .catch((err) => error(err))
      .finally(() => setLoading(false));
  }, [page, action, actorId, error]);

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Filter by action or actor UUID."
      />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Action"
            placeholder="user.ban"
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
          />
          <Input
            label="Actor ID"
            value={actorId}
            onChange={(e) => {
              setPage(1);
              setActorId(e.target.value);
            }}
          />
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                setAction("");
                setActorId("");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>
      </Card>
      {loading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState title="No audit entries" />
      ) : (
        <Card>
          <div className="portal-table-scroll">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">When</th>
                  <th className="px-2 py-2 font-medium">Action</th>
                  <th className="px-2 py-2 font-medium">Actor</th>
                  <th className="px-2 py-2 font-medium">Target</th>
                  <th className="px-2 py-2 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 align-top">
                    <td className="px-2 py-3 text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-2 py-3 font-medium text-primary">
                      {row.action}
                    </td>
                    <td className="px-2 py-3">
                      <div>{row.actorType}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {row.actorId}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div>{row.targetType ?? "—"}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {row.targetId ?? ""}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {row.ip ?? "—"}
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
