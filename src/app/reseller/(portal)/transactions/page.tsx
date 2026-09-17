"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { resellerApi } from "@/lib/api/reseller";
import type { PaginationMeta } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";

export default function ResellerTransactionsPage() {
  const { error } = useToast();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    resellerApi
      .transactions({ page, limit: 20 })
      .then((res) => {
        setItems(res.items);
        setMeta(res.meta);
      })
      .catch((err) => error(err))
      .finally(() => setLoading(false));
  }, [page, error]);

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Reseller wallet ledger."
      />
      {loading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState title="No transactions yet" />
      ) : (
        <Card>
          <div className="portal-table-scroll">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">When</th>
                  <th className="px-2 py-2 font-medium">Direction</th>
                  <th className="px-2 py-2 font-medium">Amount</th>
                  <th className="px-2 py-2 font-medium">Currency</th>
                  <th className="px-2 py-2 font-medium">Note / type</th>
                  <th className="px-2 py-2 font-medium">ID</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => {
                  const id = String(row.id ?? idx);
                  return (
                    <tr key={id} className="border-b border-border/60">
                      <td className="px-2 py-3 text-muted-foreground">
                        {formatDate(
                          typeof row.createdAt === "string"
                            ? row.createdAt
                            : null,
                        )}
                      </td>
                      <td className="px-2 py-3 capitalize">
                        {String(row.direction ?? "—")}
                      </td>
                      <td className="px-2 py-3">{String(row.amount ?? "—")}</td>
                      <td className="px-2 py-3">
                        {String(row.currency ?? "—")}
                      </td>
                      <td className="px-2 py-3">
                        {String(row.note ?? row.type ?? row.reason ?? "—")}
                      </td>
                      <td className="px-2 py-3 font-mono text-xs text-muted-foreground">
                        {id}
                      </td>
                    </tr>
                  );
                })}
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
