"use client";

import { Suspense, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { LiveRoom, PaginationMeta } from "@/lib/api/types";
import { asList, asPaginatedMeta, formatDate, isNotFoundError } from "@/lib/utils";

function RoomsList() {
  const { error, toast } = useToast();
  const [items, setItems] = useState<LiveRoom[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listRooms({ page, limit: 20 });
      setItems(asList(res));
      setMeta(asPaginatedMeta(res));
    } catch (err) {
      if (isNotFoundError(err)) toast("Rooms API not available yet");
      else error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, error, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="portal-list">
      <PageHeader title="Live rooms" description="Active and recent live rooms." />
      {loading ? (
        <LoadingBlock label="Loading rooms…" />
      ) : items.length === 0 ? (
        <EmptyState title="No rooms" />
      ) : (
        <Card>
          <div className="portal-table-scroll">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">Title</th>
                  <th className="px-2 py-2 font-medium">Host</th>
                  <th className="px-2 py-2 font-medium">Created</th>
                  <th className="px-2 py-2 font-medium">ID</th>
                </tr>
              </thead>
              <tbody>
                {items.map((room) => (
                  <tr key={room.id} className="border-b border-border/60">
                    <td className="px-2 py-3 font-medium">{room.title}</td>
                    <td className="px-2 py-3 font-mono text-xs">{room.hostId ?? "—"}</td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {formatDate(room.createdAt)}
                    </td>
                    <td className="px-2 py-3 font-mono text-xs">{room.id}</td>
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
          <div className="border-t border-border p-3">
            <Button
              type="button"
              variant="secondary"
              className="btn-press"
              onClick={() => void load()}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function AdminRoomsPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading rooms…" />}>
      <RoomsList />
    </Suspense>
  );
}
