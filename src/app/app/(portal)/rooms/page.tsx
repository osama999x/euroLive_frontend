"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { hostApi } from "@/lib/api/app";
import { ApiError } from "@/lib/api/client";
import type { LiveRoom } from "@/lib/api/types";
import { asList } from "@/lib/utils";

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
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hostApi.listRooms();
      setRooms(asList(data));
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
    setCreating(true);
    try {
      await hostApi.createRoom(title.trim());
      success("Room created");
      setTitle("");
      await load();
    } catch (err) {
      error(err);
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
      <Card title="New room">
        <form onSubmit={createRoom} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" disabled={creating}>
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
