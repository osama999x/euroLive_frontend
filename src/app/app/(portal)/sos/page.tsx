"use client";

import { FormEvent, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { hostApi } from "@/lib/api/app";
import type { SosAlert, SosStatus } from "@/lib/api/types";
import { asList, formatDate } from "@/lib/utils";

function sosTone(status: SosStatus) {
  if (status === "resolved") return "success" as const;
  if (status === "escalated") return "danger" as const;
  return "info" as const;
}

export default function AppSosPage() {
  const { error, success } = useToast();
  const [items, setItems] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await hostApi.listSos();
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
      await hostApi.createSos({
        roomId: roomId.trim() || undefined,
        message: message.trim() || undefined,
      });
      success("SOS alert created");
      setRoomId("");
      setMessage("");
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
        title="SOS"
        description="Raise SOS alerts and follow status updates."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="New SOS">
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              label="Room ID (optional)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Leave empty if not room-specific"
            />
            <Textarea
              label="Message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the emergency…"
            />
            <Button type="submit" variant="danger" disabled={busy}>
              {busy ? "Sending…" : "Send SOS"}
            </Button>
          </form>
        </Card>

        <Card title="SOS history">
          {loading ? (
            <LoadingBlock label="Loading SOS alerts…" />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No SOS alerts yet.</p>
          ) : (
            <ul className="max-h-[32rem] space-y-3 overflow-y-auto">
              {items.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={sosTone(s.status)}>{s.status}</Badge>
                    {s.overdue ? <Badge tone="danger">Overdue</Badge> : null}
                    {s.createdAt ? (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatDate(s.createdAt)}
                      </span>
                    ) : null}
                  </div>
                  {s.message ? (
                    <p className="mt-2">{s.message}</p>
                  ) : null}
                  {s.roomId ? (
                    <p className="mt-1 text-xs font-mono text-muted-foreground">
                      Room: {s.roomId}
                    </p>
                  ) : null}
                  {s.trail && Array.isArray(s.trail) && s.trail.length > 0 ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-primary">
                        Status trail ({s.trail.length})
                      </summary>
                      <pre className="mt-2 max-h-40 overflow-auto rounded bg-background/80 p-2 text-[11px] text-muted-foreground">
                        {JSON.stringify(s.trail, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
