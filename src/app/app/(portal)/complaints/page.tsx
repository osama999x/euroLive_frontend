"use client";

import { FormEvent, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { hostApi } from "@/lib/api/app";
import type { Complaint } from "@/lib/api/types";
import { asList, formatDate } from "@/lib/utils";

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

function statusTone(status: string) {
  if (status === "rejected" || status === "closed") return "default" as const;
  if (status === "action_taken") return "success" as const;
  return "info" as const;
}

export default function AppComplaintsPage() {
  const { error, success } = useToast();
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetId, setTargetId] = useState("");
  const [summary, setSummary] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await hostApi.listComplaints();
      setItems(asList(data));
    } catch (err) {
      error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        targetId: targetId.trim(),
        summary: summary.trim(),
        severity,
      };
      const url = evidenceUrl.trim();
      if (url) {
        body.evidence = [{ type: "image", url }];
      }
      await hostApi.createComplaint(body);
      success("Complaint submitted");
      setTargetId("");
      setSummary("");
      setEvidenceUrl("");
      await load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-list">
      <PageHeader
        title="Complaints"
        description="File host complaints and track their status."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="New complaint">
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              label="Target ID"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              required
            />
            <Select
              label="Severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              options={SEVERITY_OPTIONS}
            />
            <Textarea
              label="Summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
            />
            <Input
              label="Evidence URL (optional)"
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://…"
            />
            <Button type="submit" disabled={busy}>
              {busy ? "Submitting…" : "Submit complaint"}
            </Button>
          </form>
        </Card>

        <Card title="Your complaints">
          {loading ? (
            <LoadingBlock label="Loading complaints…" />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No complaints yet.</p>
          ) : (
            <ul className="max-h-[32rem] space-y-3 overflow-y-auto">
              {items.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                    {c.severity ? (
                      <span className="text-xs capitalize text-muted-foreground">
                        {c.severity}
                      </span>
                    ) : null}
                    {c.createdAt ? (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2">{c.summary}</p>
                  <p className="mt-1 text-xs font-mono text-muted-foreground">
                    Target: {c.targetId}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
