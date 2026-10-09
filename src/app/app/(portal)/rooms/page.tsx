"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { appApi, hostApi } from "@/lib/api/app";
import { ApiError } from "@/lib/api/client";
import type { HostProfile, LiveRoom } from "@/lib/api/types";
import { asList, formatDate } from "@/lib/utils";

function RoomActions({
  room,
  onUpdated,
}: {
  room: LiveRoom;
  onUpdated: () => void;
}) {
  const { error, success } = useToast();
  const [wallpaperId, setWallpaperId] = useState(
    room.backgroundCatalogItemId ?? "",
  );
  const [staffUserId, setStaffUserId] = useState("");
  const [kickUserId, setKickUserId] = useState("");
  const [kickReason, setKickReason] = useState("");
  const [blacklistUserId, setBlacklistUserId] = useState("");
  const [blacklistReason, setBlacklistReason] = useState("");
  const [unblacklistUserId, setUnblacklistUserId] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>, okMessage: string) {
    setBusy(true);
    try {
      await action();
      success(okMessage);
      onUpdated();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 403) {
        error(
          err.message.includes("Official")
            ? err
            : new ApiError(
                "Action not allowed — Official accounts may be protected.",
                403,
              ),
        );
      } else {
        error(err);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void run(
            () => hostApi.setBackground(room.id, wallpaperId.trim()),
            "Wallpaper updated",
          );
        }}
      >
        <Input
          label="Wallpaper catalog item ID"
          value={wallpaperId}
          onChange={(e) => setWallpaperId(e.target.value)}
          placeholder="Catalog item (type wallpaper)"
          className="flex-1"
          required
        />
        <Button type="submit" variant="secondary" disabled={busy}>
          Set background
        </Button>
      </form>

      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void run(
            () => hostApi.addStaff(room.id, staffUserId.trim()),
            "Staff added",
          ).then(() => setStaffUserId(""));
        }}
      >
        <Input
          label="Add staff (user ID)"
          value={staffUserId}
          onChange={(e) => setStaffUserId(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" disabled={busy}>
          Add staff
        </Button>
      </form>

      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void run(
            () => hostApi.removeStaff(room.id, staffUserId.trim()),
            "Staff removed",
          ).then(() => setStaffUserId(""));
        }}
      >
        <Input
          label="Remove staff (user ID)"
          value={staffUserId}
          onChange={(e) => setStaffUserId(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" variant="secondary" disabled={busy}>
          Remove staff
        </Button>
      </form>

      <form
        className="space-y-2"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void run(
            () =>
              hostApi.kick(room.id, {
                userId: kickUserId.trim(),
                reason: kickReason.trim() || undefined,
              }),
            "User kicked",
          ).then(() => {
            setKickUserId("");
            setKickReason("");
          });
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            label="Kick user ID"
            value={kickUserId}
            onChange={(e) => setKickUserId(e.target.value)}
            className="flex-1"
            required
          />
          <Input
            label="Reason (optional)"
            value={kickReason}
            onChange={(e) => setKickReason(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" disabled={busy}>
            Kick
          </Button>
        </div>
      </form>

      <form
        className="space-y-2"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void run(
            () =>
              hostApi.blacklist(room.id, {
                userId: blacklistUserId.trim(),
                reason: blacklistReason.trim() || undefined,
              }),
            "User blacklisted",
          ).then(() => {
            setBlacklistUserId("");
            setBlacklistReason("");
          });
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            label="Blacklist user ID"
            value={blacklistUserId}
            onChange={(e) => setBlacklistUserId(e.target.value)}
            className="flex-1"
            required
          />
          <Input
            label="Reason (optional)"
            value={blacklistReason}
            onChange={(e) => setBlacklistReason(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="danger" disabled={busy}>
            Blacklist
          </Button>
        </div>
      </form>

      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void run(
            () => hostApi.unblacklist(room.id, unblacklistUserId.trim()),
            "User removed from blacklist",
          ).then(() => setUnblacklistUserId(""));
        }}
      >
        <Input
          label="Unblacklist user ID"
          value={unblacklistUserId}
          onChange={(e) => setUnblacklistUserId(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" variant="secondary" disabled={busy}>
          Unblacklist
        </Button>
      </form>
    </div>
  );
}

export default function AppRoomsPage() {
  const { error, success } = useToast();
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [host, setHost] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const liveBanned = Boolean(
    host?.liveBanned ||
      (host as HostProfile & { user?: { liveBanned?: boolean } })?.user
        ?.liveBanned,
  );
  const liveBannedUntil =
    host?.liveBannedUntil ??
    (
      host as HostProfile & {
        user?: { liveBannedUntil?: string | null };
      }
    )?.user?.liveBannedUntil ??
    null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, dash, me] = await Promise.all([
        hostApi.listRooms(),
        hostApi.dashboard().catch(() => null),
        appApi.me().catch(() => null),
      ]);
      setRooms(asList(data));
      if (dash?.host) {
        setHost({
          ...dash.host,
          liveBanned: dash.host.liveBanned ?? me?.liveBanned,
          liveBannedUntil: dash.host.liveBannedUntil ?? me?.liveBannedUntil,
        });
      } else if (me) {
        setHost((prev) =>
          prev
            ? {
                ...prev,
                liveBanned: me.liveBanned,
                liveBannedUntil: me.liveBannedUntil,
              }
            : {
                id: "",
                userId: me.id,
                agencyId: null,
                country: me.country ?? "",
                status: "active",
                liveBanned: me.liveBanned,
                liveBannedUntil: me.liveBannedUntil,
              },
        );
      }
    } catch (err) {
      error(err);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createRoom(e: FormEvent) {
    e.preventDefault();
    if (liveBanned) {
      error(
        liveBannedUntil
          ? `Live streaming is banned until ${formatDate(liveBannedUntil)}`
          : "Live streaming is banned",
      );
      return;
    }
    setCreating(true);
    try {
      await hostApi.createRoom(title.trim());
      success("Room created");
      setTitle("");
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 403) {
        error(err.message || "Live streaming is banned");
        await load();
      } else {
        error(err);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="portal-list">
      <PageHeader
        title="Rooms"
        description="Create rooms and manage wallpaper, staff, kicks, and blacklists."
      />
      {liveBanned ? (
        <Card className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="danger">Live streaming banned</Badge>
            <span className="text-sm text-muted-foreground">
              {liveBannedUntil
                ? `Until ${formatDate(liveBannedUntil)}`
                : "Permanent"}
              . Go Live / create room is disabled.
            </span>
          </div>
        </Card>
      ) : null}
      <Card title="New room / Go Live">
        <form onSubmit={createRoom} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1"
            required
            disabled={liveBanned}
          />
          <Button type="submit" disabled={creating || liveBanned}>
            {creating ? "Creating…" : "Create room"}
          </Button>
        </form>
      </Card>

      {loading ? (
        <LoadingBlock label="Loading rooms…" />
      ) : rooms.length === 0 ? (
        <Card className="mt-4" title="Your rooms">
          <p className="text-sm text-muted-foreground">No rooms yet.</p>
        </Card>
      ) : (
        <div className="mt-4 space-y-4">
          {rooms.map((room) => (
            <Card key={room.id} title={room.title}>
              <p className="text-xs font-mono text-muted-foreground">{room.id}</p>
              {room.backgroundCatalogItemId ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Wallpaper: {room.backgroundCatalogItemId}
                </p>
              ) : null}
              <RoomActions room={room} onUpdated={() => void load()} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
