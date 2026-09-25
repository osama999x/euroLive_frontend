"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { Complaint } from "@/lib/api/types";
import { useAdminAuth } from "@/lib/auth/admin-store";
import { isMaster } from "@/lib/auth/roles";
import { formatDate, isNotFoundError } from "@/lib/utils";

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const { staff } = useAdminAuth();
  const master = isMaster(staff?.roles);
  const { error, success, toast } = useToast();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [note, setNote] = useState("");
  const [salaryDeduct, setSalaryDeduct] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    adminApi
      .getComplaint(params.id)
      .then(setComplaint)
      .catch((err) => {
        if (isNotFoundError(err)) toast("Complaint not found");
        else error(err);
      });
  }, [params.id, error, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(action: "confirm" | "reject" | "close") {
    setBusy(true);
    try {
      await adminApi.reviewComplaint(params.id, {
        action,
        note: note || undefined,
        salaryDeduct: action === "confirm" && master ? salaryDeduct : undefined,
      });
      success(`Complaint ${action === "confirm" ? "confirmed" : action}`);
      load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  if (!complaint) return <LoadingBlock label="Loading complaint…" />;

  const evidence = master ? complaint.evidence : undefined;

  return (
    <div>
      <PageHeader
        title="Complaint review"
        description={complaint.summary}
        action={
          <Link href="/admin/complaints">
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />

      <div className="mb-4">
        <Badge tone="default">{complaint.status}</Badge>
        {complaint.protectionLock ? (
          <Badge tone="gold" className="ml-2">
            Protection lock
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Details">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Target</dt>
              <dd className="font-mono text-xs">{complaint.targetId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Type</dt>
              <dd>{complaint.type ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Severity</dt>
              <dd>{complaint.severity ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDate(complaint.createdAt)}</dd>
            </div>
          </dl>
          {master && evidence?.length ? (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-sm font-medium">Evidence (Master only)</p>
              <ul className="space-y-2 text-sm">
                {evidence.map((ev, i) => (
                  <li key={i}>
                    <span className="text-muted-foreground">{ev.type}:</span>{" "}
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      {ev.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : master ? (
            <p className="mt-4 text-sm text-muted-foreground">No evidence attached.</p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Evidence is visible to Master admins only.
            </p>
          )}
        </Card>

        <Card title="Review">
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
            }}
            className="space-y-3"
          >
            <Textarea
              label="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {master ? (
              <label className="flex items-center justify-between text-sm">
                <span>Salary deduct on confirm</span>
                <input
                  type="checkbox"
                  checked={salaryDeduct}
                  onChange={(e) => setSalaryDeduct(e.target.checked)}
                />
              </label>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={busy}
                onClick={() => void review("confirm")}
              >
                Confirm
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void review("reject")}
              >
                Reject
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={busy}
                onClick={() => void review("close")}
              >
                Close
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
