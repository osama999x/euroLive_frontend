"use client";

import { FormEvent, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Modal, Pagination } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader, Tabs } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { CatalogItem, CatalogType, PaginationMeta } from "@/lib/api/types";

const tabs: { id: CatalogType; label: string }[] = [
  { id: "frame", label: "Frames" },
  { id: "entry", label: "Entries" },
  { id: "badge", label: "Badges" },
];

const emptyForm = {
  name: "",
  description: "",
  assetUrl: "",
  price: "0",
  isActive: true,
  resellerAccess: true,
  eligibility: "all",
  defaultExpiryDays: "7",
};

export default function AdminCatalogPage() {
  const { error, success } = useToast();
  const [type, setType] = useState<CatalogType>("frame");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  function reload() {
    setLoading(true);
    adminApi
      .listCatalog({ page, limit: 20, type })
      .then((res) => {
        setItems(res.items);
        setMeta(res.meta);
      })
      .catch((err) => error(err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, type]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(item: CatalogItem) {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      assetUrl: item.assetUrl,
      price: String(item.price),
      isActive: item.isActive,
      resellerAccess: item.resellerAccess,
      eligibility: item.eligibility,
      defaultExpiryDays:
        item.defaultExpiryDays === null || item.defaultExpiryDays === undefined
          ? ""
          : String(item.defaultExpiryDays),
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const body = {
      name: form.name,
      description: form.description || undefined,
      assetUrl: form.assetUrl,
      price: Number.parseInt(form.price, 10),
      isActive: form.isActive,
      resellerAccess: form.resellerAccess,
      eligibility: form.eligibility,
      defaultExpiryDays:
        form.defaultExpiryDays === ""
          ? null
          : Number.parseInt(form.defaultExpiryDays, 10),
    };
    try {
      if (editing) {
        await adminApi.updateCatalogItem(editing.id, body);
        success("Catalog item updated");
      } else {
        await adminApi.createCatalogItem({ ...body, type });
        success("Catalog item created");
      }
      setOpen(false);
      reload();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Soft-delete this catalog item?")) return;
    try {
      await adminApi.deleteCatalogItem(id);
      success("Deleted");
      reload();
    } catch (err) {
      error(err);
    }
  }

  return (
    <div>
      <PageHeader
        title="Catalog"
        description="Frames, entries, and badges. Price is coins debited from reseller on assign."
        action={<Button onClick={openCreate}>Add item</Button>}
      />
      <Tabs
        tabs={tabs}
        value={type}
        onChange={(id) => {
          setPage(1);
          setType(id as CatalogType);
        }}
      />
      <div className="mt-4">
        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState title="No items in this tab" />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 font-medium">Preview</th>
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Price</th>
                    <th className="px-2 py-2 font-medium">Flags</th>
                    <th className="px-2 py-2 font-medium">Expiry days</th>
                    <th className="px-2 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/60">
                      <td className="px-2 py-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.assetUrl}
                          alt={item.name}
                          className="h-10 w-10 rounded object-cover ring-1 ring-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </td>
                      <td className="px-2 py-3">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </td>
                      <td className="px-2 py-3">{item.price}</td>
                      <td className="px-2 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Badge tone={item.isActive ? "success" : "default"}>
                            {item.isActive ? "active" : "inactive"}
                          </Badge>
                          <Badge tone={item.resellerAccess ? "gold" : "default"}>
                            {item.resellerAccess ? "reseller" : "admin only"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        {item.defaultExpiryDays ?? "permanent"}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEdit(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onDelete(item.id)}
                          >
                            Delete
                          </Button>
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
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit catalog item" : `New ${type}`}
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label="Asset URL"
            required
            value={form.assetUrl}
            onChange={(e) => setForm({ ...form, assetUrl: e.target.value })}
          />
          <Input
            label="Price (coins)"
            type="number"
            min={0}
            step={1}
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <Input
            label="Default expiry days (empty = permanent)"
            type="number"
            min={1}
            step={1}
            value={form.defaultExpiryDays}
            onChange={(e) =>
              setForm({ ...form, defaultExpiryDays: e.target.value })
            }
          />
          <Input
            label="Eligibility"
            value={form.eligibility}
            onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
          />
          <label className="flex items-center justify-between text-sm">
            <span>Active</span>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>Reseller access</span>
            <input
              type="checkbox"
              checked={form.resellerAccess}
              onChange={(e) =>
                setForm({ ...form, resellerAccess: e.target.checked })
              }
            />
          </label>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Saving…" : "Save"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
