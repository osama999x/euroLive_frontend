"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { appApi } from "@/lib/api/app";

const TARGET_TYPES = [
  { value: "user", label: "User" },
  { value: "host", label: "Host" },
  { value: "agency", label: "Agency" },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function AppReportPage() {
  const { error, success } = useToast();
  const [targetId, setTargetId] = useState("");
  const [targetType, setTargetType] = useState("user");
  const [summary, setSummary] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const url = evidenceUrl.trim();
      await appApi.createReport({
        targetId: targetId.trim(),
        targetType: targetType as "user" | "host" | "agency",
        summary: summary.trim(),
        severity: severity as "low" | "medium" | "high" | "critical",
        type: "user_report",
        evidence: url ? [{ type: "image", url }] : undefined,
      });
      success("Report submitted — thank you");
      setTargetId("");
      setSummary("");
      setEvidenceUrl("");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Report"
        description="Report a user, host, or agency for review."
      />
      <Card title="Submit report" className="max-w-xl">
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            label="Target ID"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            required
          />
          <Select
            label="Target type"
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            options={TARGET_TYPES}
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
            {busy ? "Submitting…" : "Submit report"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
