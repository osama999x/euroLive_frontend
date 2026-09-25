"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Modal, Pagination } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { Complaint, ComplaintStatus, PaginationMeta } from "@/lib/api/types";
import { asList, asPaginatedMeta, formatDate, isNotFoundError } from "@/lib/utils";

function ComplaintsList() {
  const { error, toast } = useToast();
  const [items, setItems] = useState<Complaint[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ComplaintStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Complaint | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listComplaints({
        page,
        limit: 20,
        status: status || undefined,
      });
      setItems(asList(res));
      setMeta(asPaginatedMeta(res));
    } catch (err) {
      if (isNotFoundError(err)) toast("Complaints API not available yet");
      else error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, error, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const c = await adminApi.getComplaint(id);
      setDetail(c);
    } catch (err) {
      if (isNotFoundError(err)) toast("Complaint not found");
      else error(err);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="portal-list">
      <PageHeader title="Complaints" description="User and host complaint queue." />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as ComplaintStatus | "");
            }}
            options={[
              { value: "", label: "All" },
              { value: "received", label: "Received" },
              { value: "under_review", label: "Under review" },
              { value: "action_taken", label: "Action taken" },
              { value: "rejected", label: "Rejected" },
              { value: "closed", label: "Closed" },
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
        <LoadingBlock label="Loading complaints…" />
      ) : items.length === 0 ? (
        <EmptyState title="No complaints" />
      ) : (
        <Card>
          <div className="portal-table-scroll">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">Summary</th>
                  <th className="px-2 py-2 font-medium">Target</th>
                  <th className="px-2 py-2 font-medium">Severity</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Created</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="max-w-xs truncate px-2 py-3">{c.summary}</td>
                    <td className="px-2 py-3 font-mono text-xs">{c.targetId}</td>
                    <td className="px-2 py-3">{c.severity ?? "—"}</td>
                    <td className="px-2 py-3">
                      <Badge tone="default">{c.status}</Badge>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void openDetail(c.id)}
                        >
                          Quick view
                        </Button>
                        <Link href={`/admin/complaints/${c.id}`}>
                          <Button size="sm" className="btn-press">
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

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.summary ?? "Complaint"}
      >
        {detailLoading ? (
          <LoadingBlock label="Loading…" />
        ) : detail ? (
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Status:</span> {detail.status}
            </p>
            <p>
              <span className="text-muted-foreground">Target:</span> {detail.targetId}
            </p>
            <Link href={`/admin/complaints/${detail.id}`}>
              <Button className="w-full">Full review</Button>
            </Link>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default function AdminComplaintsPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading complaints…" />}>
      <ComplaintsList />
    </Suspense>
  );
}
