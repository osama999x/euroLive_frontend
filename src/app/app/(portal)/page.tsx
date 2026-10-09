"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, StatCard } from "@/components/ui/card";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { hostApi } from "@/lib/api/app";
import { ApiError } from "@/lib/api/client";
import type { HostProfile, LiveRoom } from "@/lib/api/types";
import { useAppAuth } from "@/lib/auth/app-store";
import { formatDate } from "@/lib/utils";

export default function AppDashboardPage() {
  const { user } = useAppAuth();
  const { error } = useToast();
  const [hostData, setHostData] = useState<{
    host: HostProfile;
    rooms: LiveRoom[];
  } | null>(null);
  const [isHost, setIsHost] = useState<boolean | null>(null);

  useEffect(() => {
    hostApi
      .dashboard()
      .then((data) => {
        setHostData(data);
        setIsHost(true);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.statusCode === 403) {
          setIsHost(false);
        } else {
          error(err);
          setIsHost(false);
        }
      });
  }, [error]);

  if (isHost === null) return <LoadingBlock label="Loading dashboard…" />;

  if (!isHost && user) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          description={`Welcome, ${user.displayName}`}
        />
        <Card title="Your account">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Public ID</dt>
              <dd className="font-mono text-primary">{user.publicId}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Username</dt>
              <dd>@{user.username}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{user.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Official</dt>
              <dd>
                {user.isOfficial ? (
                  <Badge tone="gold">Official account</Badge>
                ) : (
                  "No"
                )}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    );
  }

  if (!hostData) return <LoadingBlock />;

  const { host, rooms } = hostData;

  return (
    <div className="portal-list">
      <PageHeader
        title="Host dashboard"
        description={
          host.user?.displayName
            ? `Welcome, ${host.user.displayName}`
            : "Manage your live rooms"
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Live rooms" value={rooms.length} />
        <StatCard label="Country" value={host.country} />
        <StatCard label="Status" value={host.status} />
      </div>
      <Card className="mt-6" title="Host profile">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {host.user ? (
            <>
              <div>
                <dt className="text-muted-foreground">Public ID</dt>
                <dd className="font-mono text-primary">{host.user.publicId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Username</dt>
                <dd>@{host.user.username}</dd>
              </div>
            </>
          ) : null}
          {host.agency ? (
            <div>
              <dt className="text-muted-foreground">Agency</dt>
              <dd>{host.agency.displayName}</dd>
            </div>
          ) : null}
          {host.protectionLocked ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Protection</dt>
              <dd>
                <Badge tone="info">Locked</Badge>
                {host.protectionCaseNumber ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    Case {host.protectionCaseNumber}
                  </span>
                ) : null}
              </dd>
            </div>
          ) : null}
          {host.liveBanned || user?.liveBanned ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Live streaming</dt>
              <dd>
                <Badge tone="danger">Banned</Badge>
                <span className="ml-2 text-xs text-muted-foreground">
                  Until{" "}
                  {host.liveBannedUntil || user?.liveBannedUntil
                    ? formatDate(
                        host.liveBannedUntil ?? user?.liveBannedUntil ?? null,
                      )
                    : "Permanent"}
                </span>
              </dd>
            </div>
          ) : null}
        </dl>
      </Card>
      <Card className="mt-4" title="Rooms">
        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rooms yet.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {rooms.map((room) => (
              <li
                key={room.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">{room.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {room.id}
                  </p>
                </div>
                {room.createdAt ? (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(room.createdAt)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
