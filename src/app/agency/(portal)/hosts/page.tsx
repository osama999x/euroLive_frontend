"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { agencyApi } from "@/lib/api/agency";
import type { HostProfile, PaginationMeta } from "@/lib/api/types";
import { cn } from "@/lib/utils";

function hostStatusTone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "suspended" || status === "frozen") return "danger" as const;
  return "default" as const;
}

export default function AgencyHostsPage() {
  const { error } = useToast();
  const [items, setItems] = useState<HostProfile[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    agencyApi
      .hosts({ page, limit: 20 })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setMeta(res.meta);
      })
      .catch((err) => {
        if (!cancelled) error(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, error]);

  return (
    <div className="portal-list">
      <PageHeader
        title="Hosts"
        description="Roster for your agency. Public profile fields only."
      />
      {loading ? (
        <LoadingBlock label="Loading hosts…" />
      ) : items.length === 0 ? (
        <EmptyState title="No hosts yet" />
      ) : (
        <Card>
          <div className="portal-table-scroll">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">Public ID</th>
                  <th className="px-2 py-2 font-medium">Host</th>
                  <th className="px-2 py-2 font-medium">Country</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((host, i) => {
                  const publicId = host.user?.publicId ?? "—";
                  const username = host.user?.username ?? "—";
                  const displayName = host.user?.displayName ?? "—";
                  return (
                    <tr
                      key={host.id}
                      style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                      className={cn(
                        "portal-row border-b border-border/60 transition hover:bg-primary/5",
                      )}
                    >
                      <td className="px-2 py-3 font-mono text-primary">{publicId}</td>
                      <td className="px-2 py-3">
                        <div className="font-medium">{displayName}</div>
                        <div className="text-xs text-muted-foreground">@{username}</div>
                      </td>
                      <td className="px-2 py-3">{host.country}</td>
                      <td className="px-2 py-3">
                        <Badge tone={hostStatusTone(host.status)}>{host.status}</Badge>
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
              onPageChange={(next) => {
                setLoading(true);
                setPage(next);
              }}
            />
          ) : null}
        </Card>
      )}
    </div>
  );
}
