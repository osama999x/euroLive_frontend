"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { appApi, hostApi } from "@/lib/api/app";
import { ApiError } from "@/lib/api/client";
import type { BlockedRoomUser, HostProfile, LiveRoom } from "@/lib/api/types";
import { asList, formatDate } from "@/lib/utils";

function sameUser(key: string, row: BlockedRoomUser) {
  const value = key.trim().toLowerCase();
  return (
    value === row.userId.toLowerCase() ||
    value === row.publicId.toLowerCase() ||
    value === row.username.toLowerCase()
  );
}

function BlockList({
  roomId,
  hostUserId,
  hostPublicId,
  onChange,
}: {
  roomId: string;
  hostUserId?: string;
  hostPublicId?: string;
  onChange?: (rows: BlockedRoomUser[]) => void;
}) {
  const { error, success } = useToast();
  const [items, setItems] = useState<BlockedRoomUser[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const publish = useCallback((rows: BlockedRoomUser[]) => {
    setItems(rows);
    onChangeRef.current?.(rows);
  }, []);

  const load = useCallback(async () => {
    try {
      publish(asList(await hostApi.listBlacklist(roomId)));
    } catch (err) {
      error(err);
    }
  }, [error, publish, roomId]);

  useEffect(() => {
    void load();
  }, [load]);

  const key = draft.trim();
  const existing = items.find((row) => sameUser(key, row));
  const isSelf =
    Boolean(key) &&
    (key === hostUserId ||
      key === hostPublicId ||
      key.toLowerCase() === hostPublicId?.toLowerCase());

  async function block() {
    if (!key || pending) return;
    if (isSelf) {
      error("You cannot block yourself");
      return;
    }
    if (existing) {
      setFlashId(existing.userId);
      window.setTimeout(() => setFlashId(null), 900);
      error("This user is already on your block list");
      return;
    }
    setPending(true);
    try {
      const saved = await hostApi.blacklist(roomId, key);
      if (saved.alreadyBlocked) {
        setFlashId(saved.userId);
        error("This user is already on your block list");
      } else {
        publish([saved, ...items.filter((row) => row.userId !== saved.userId)]);
        setFlashId(saved.userId);
        success("User blocked");
      }
      setDraft("");
      window.setTimeout(() => setFlashId(null), 900);
    } catch (err) {
      error(err);
    } finally {
      setPending(false);
    }
  }

  async function unblock(row: BlockedRoomUser) {
    if (leavingId) return;
    setLeavingId(row.userId);
    window.setTimeout(() => {
      void hostApi
        .unblacklist(roomId, row.publicId || row.userId)
        .then(() => {
          publish(items.filter((item) => item.userId !== row.userId));
          success("User unblocked");
        })
        .catch((err) => error(err))
        .finally(() => setLeavingId(null));
    }, 220);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">Manage your block list</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Enter a user ID, then tap it. One tap blocks them. No extra options.
        </p>
      </div>
      <Input
        label="User ID"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Public ID or user ID"
        autoComplete="off"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void block();
          }
        }}
      />
      {key ? (
        <button
          type="button"
          disabled={pending || isSelf}
          onClick={() => void block()}
          className="btn-press flex w-full items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 px-3 py-3 text-left transition hover:border-danger disabled:opacity-60"
        >
          <span className="min-w-0">
            <span className="block font-mono text-sm text-foreground">{key}</span>
            <span className="block text-xs text-muted-foreground">
              {isSelf
                ? "You cannot block yourself"
                : existing
                  ? "Already blocked — tap to highlight"
                  : "Tap this ID to block"}
            </span>
          </span>
          <span className="shrink-0 text-xs font-medium text-danger">
            {pending ? "Blocking…" : "Block"}
          </span>
        </button>
      ) : null}
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No blocked users yet.</p>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
          {items.map((row) => (
            <li
              key={row.userId}
              className={
                leavingId === row.userId
                  ? "block-leave flex items-center justify-between gap-3 px-3 py-2.5"
                  : flashId === row.userId
                    ? "block-flash flex items-center justify-between gap-3 px-3 py-2.5"
                    : "block-row flex items-center justify-between gap-3 px-3 py-2.5"
              }
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-sm text-primary">{row.publicId || row.userId}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.displayName ? `${row.displayName} · ` : ""}@{row.username || "user"}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="btn-press shrink-0"
                disabled={leavingId === row.userId}
                onClick={() => void unblock(row)}
              >
                Unblock
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RoomActions({
  room,
  hostUserId,
  hostPublicId,
  onUpdated,
}: {
  room: LiveRoom;
  hostUserId?: string;
  hostPublicId?: string;
  onUpdated: () => void;
}) {
  const { error, success } = useToast();
  const [wallpaperId, setWallpaperId] = useState(
    room.backgroundCatalogItemId ?? "",
  );
  const [staffUserId, setStaffUserId] = useState("");
  const [kickUserId, setKickUserId] = useState("");
  const [kickReason, setKickReason] = useState("");
  const [blockedKeys, setBlockedKeys] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  function rememberBlocked(rows: BlockedRoomUser[]) {
    const next = new Set<string>();
    for (const row of rows) {
      next.add(row.userId.toLowerCase());
      if (row.publicId) next.add(row.publicId.toLowerCase());
      if (row.username) next.add(row.username.toLowerCase());
    }
    setBlockedKeys(next);
  }

  function isBlockedKey(value: string) {
    return blockedKeys.has(value.trim().toLowerCase());
  }

  async function run(action: () => Promise<unknown>, okMessage: string) {
    setBusy(true);
    try {
      await action();
      success(okMessage);
      onUpdated();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 403) {
        error(
          err.message.includes("Official") || err.message.includes("blocked")
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
          if (isBlockedKey(staffUserId)) {
            error("This user is blocked from this room");
            return;
          }
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

      <BlockList
        roomId={room.id}
        hostUserId={hostUserId}
        hostPublicId={hostPublicId}
        onChange={rememberBlocked}
      />
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
        description="Create rooms, manage staff and kicks, and block a user with one tap on their ID."
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
              <RoomActions
                room={room}
                hostUserId={host?.userId}
                hostPublicId={host?.user?.publicId}
                onUpdated={() => void load()}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
