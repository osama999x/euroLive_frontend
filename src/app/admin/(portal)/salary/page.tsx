"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { EmptyState, LoadingBlock, PageHeader, Tabs } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { CountryRule, SalaryPeriod, SalaryRule } from "@/lib/api/types";
import { useAdminAuth } from "@/lib/auth/admin-store";
import { isMaster } from "@/lib/auth/roles";
import { asList, formatDate, isNotFoundError } from "@/lib/utils";

const tabs = [
  { id: "countries", label: "Countries" },
  { id: "rules", label: "Salary rules" },
  { id: "periods", label: "Periods" },
  { id: "hours", label: "Host hours" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function AdminSalaryPage() {
  const { staff } = useAdminAuth();
  const master = isMaster(staff?.roles);
  const { error, success, toast } = useToast();
  const [tab, setTab] = useState<TabId>("countries");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [countries, setCountries] = useState<CountryRule[]>([]);
  const [countryEdit, setCountryEdit] = useState<{ code: string; holdDays: string } | null>(
    null,
  );

  const [rules, setRules] = useState<SalaryRule[]>([]);
  const [ruleCountry, setRuleCountry] = useState("");
  const [ruleForm, setRuleForm] = useState({
    id: "",
    countryCode: "PK",
    name: "",
    requiredHours: "",
    requiredDays: "",
    salaryAmount: "",
  });

  const [periods, setPeriods] = useState<SalaryPeriod[]>([]);
  const [periodForm, setPeriodForm] = useState({
    label: "",
    startsOn: "",
    endsOn: "",
  });

  const [hoursForm, setHoursForm] = useState({
    hostId: "",
    periodId: "",
    liveHours: "",
    liveDays: "",
    beans: "",
  });

  const loadCountries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listCountries();
      setCountries(asList(res));
    } catch (err) {
      if (isNotFoundError(err)) toast("Countries API not available yet");
      else error(err);
    } finally {
      setLoading(false);
    }
  }, [error, toast]);

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listSalaryRules({
        countryCode: ruleCountry || undefined,
      });
      setRules(asList(res));
    } catch (err) {
      if (isNotFoundError(err)) toast("Salary rules not available yet");
      else error(err);
    } finally {
      setLoading(false);
    }
  }, [ruleCountry, error, toast]);

  const loadPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listSalaryPeriods();
      setPeriods(asList(res));
    } catch (err) {
      if (isNotFoundError(err)) toast("Periods not available yet");
      else error(err);
    } finally {
      setLoading(false);
    }
  }, [error, toast]);

  useEffect(() => {
    if (tab === "countries") void loadCountries();
    if (tab === "rules") void loadRules();
    if (tab === "periods") void loadPeriods();
  }, [tab, loadCountries, loadRules, loadPeriods]);

  async function saveCountryHold(e: FormEvent) {
    e.preventDefault();
    if (!countryEdit || !master) return;
    setBusy(true);
    try {
      await adminApi.updateCountry(countryEdit.code, {
        payoutHoldDays: Number.parseInt(countryEdit.holdDays, 10),
      });
      success("Country updated");
      setCountryEdit(null);
      void loadCountries();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function saveRule(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const body = {
      countryCode: ruleForm.countryCode,
      name: ruleForm.name,
      requiredHours: ruleForm.requiredHours
        ? Number.parseFloat(ruleForm.requiredHours)
        : null,
      requiredDays: ruleForm.requiredDays
        ? Number.parseInt(ruleForm.requiredDays, 10)
        : null,
      salaryAmount: ruleForm.salaryAmount
        ? Number.parseFloat(ruleForm.salaryAmount)
        : null,
    };
    try {
      if (ruleForm.id) {
        await adminApi.updateSalaryRule(ruleForm.id, body);
        success("Rule updated");
      } else {
        await adminApi.createSalaryRule(body);
        success("Rule created");
      }
      setRuleForm({
        id: "",
        countryCode: "PK",
        name: "",
        requiredHours: "",
        requiredDays: "",
        salaryAmount: "",
      });
      void loadRules();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function createPeriod(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.createSalaryPeriod(periodForm);
      success("Period created");
      setPeriodForm({ label: "", startsOn: "", endsOn: "" });
      void loadPeriods();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function postHours(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.postHostHours(hoursForm.hostId.trim(), {
        periodId: hoursForm.periodId.trim(),
        liveHours: Number.parseFloat(hoursForm.liveHours),
        liveDays: Number.parseInt(hoursForm.liveDays, 10),
        beans: hoursForm.beans ? Number.parseInt(hoursForm.beans, 10) : undefined,
      });
      success("Hours posted");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Salary"
        description="Country hold rules, salary tiers, periods, and manual hour posts."
      />
      <Tabs tabs={[...tabs]} value={tab} onChange={(id) => setTab(id as TabId)} />

      <div className="mt-4">
        {loading ? <LoadingBlock /> : null}

        {tab === "countries" && !loading ? (
          countries.length === 0 ? (
            <EmptyState title="No countries" />
          ) : (
            <Card>
              <div className="portal-table-scroll">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2">Code</th>
                      <th className="px-2 py-2">Name</th>
                      <th className="px-2 py-2">Hold days</th>
                      <th className="px-2 py-2">Active</th>
                      {master ? <th className="px-2 py-2" /> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {countries.map((c) => (
                      <tr key={c.code} className="border-b border-border/60">
                        <td className="px-2 py-3 font-mono">{c.code}</td>
                        <td className="px-2 py-3">{c.name}</td>
                        <td className="px-2 py-3">{c.payoutHoldDays}</td>
                        <td className="px-2 py-3">{c.isActive ? "Yes" : "No"}</td>
                        {master ? (
                          <td className="px-2 py-3 text-right">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setCountryEdit({
                                  code: c.code,
                                  holdDays: String(c.payoutHoldDays),
                                })
                              }
                            >
                              Edit hold
                            </Button>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {countryEdit && master ? (
                <form
                  onSubmit={saveCountryHold}
                  className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3"
                >
                  <Input label="Country" value={countryEdit.code} disabled />
                  <Input
                    label="Payout hold days"
                    type="number"
                    min={0}
                    required
                    value={countryEdit.holdDays}
                    onChange={(e) =>
                      setCountryEdit({ ...countryEdit, holdDays: e.target.value })
                    }
                  />
                  <div className="flex items-end gap-2">
                    <Button type="submit" disabled={busy}>
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setCountryEdit(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : null}
            </Card>
          )
        ) : null}

        {tab === "rules" && !loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title={ruleForm.id ? "Edit rule" : "Create rule"}>
              <form onSubmit={saveRule} className="space-y-3">
                <Select
                  label="Country"
                  value={ruleForm.countryCode}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, countryCode: e.target.value })
                  }
                  options={[
                    { value: "PK", label: "PK" },
                    { value: "IN", label: "IN" },
                    { value: "BD", label: "BD" },
                  ]}
                />
                <Input
                  label="Name"
                  required
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                />
                <Input
                  label="Required hours"
                  type="number"
                  value={ruleForm.requiredHours}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, requiredHours: e.target.value })
                  }
                />
                <Input
                  label="Required days"
                  type="number"
                  value={ruleForm.requiredDays}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, requiredDays: e.target.value })
                  }
                />
                <Input
                  label="Salary amount"
                  type="number"
                  value={ruleForm.salaryAmount}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, salaryAmount: e.target.value })
                  }
                />
                <Button type="submit" disabled={busy}>
                  {ruleForm.id ? "Update" : "Create"}
                </Button>
              </form>
            </Card>
            <Card title="Rules">
              <div className="mb-3">
                <Select
                  label="Filter country"
                  value={ruleCountry}
                  onChange={(e) => setRuleCountry(e.target.value)}
                  options={[
                    { value: "", label: "All" },
                    { value: "PK", label: "PK" },
                    { value: "IN", label: "IN" },
                    { value: "BD", label: "BD" },
                  ]}
                />
              </div>
              {rules.length === 0 ? (
                <EmptyState title="No rules" />
              ) : (
                <ul className="space-y-2 text-sm">
                  {rules.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between rounded border border-border px-3 py-2"
                    >
                      <span>
                        {r.name} ({r.countryCode})
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setRuleForm({
                            id: r.id,
                            countryCode: r.countryCode,
                            name: r.name,
                            requiredHours:
                              r.requiredHours != null ? String(r.requiredHours) : "",
                            requiredDays:
                              r.requiredDays != null ? String(r.requiredDays) : "",
                            salaryAmount:
                              r.salaryAmount != null ? String(r.salaryAmount) : "",
                          })
                        }
                      >
                        Edit
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        ) : null}

        {tab === "periods" && !loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Create period">
              <form onSubmit={createPeriod} className="space-y-3">
                <Input
                  label="Label"
                  required
                  value={periodForm.label}
                  onChange={(e) =>
                    setPeriodForm({ ...periodForm, label: e.target.value })
                  }
                />
                <Input
                  label="Starts on (ISO date)"
                  required
                  value={periodForm.startsOn}
                  onChange={(e) =>
                    setPeriodForm({ ...periodForm, startsOn: e.target.value })
                  }
                />
                <Input
                  label="Ends on (ISO date)"
                  required
                  value={periodForm.endsOn}
                  onChange={(e) =>
                    setPeriodForm({ ...periodForm, endsOn: e.target.value })
                  }
                />
                <Button type="submit" disabled={busy}>
                  Create period
                </Button>
              </form>
            </Card>
            <Card title="Periods">
              {periods.length === 0 ? (
                <EmptyState title="No periods" />
              ) : (
                <ul className="space-y-2 text-sm">
                  {periods.map((p) => (
                    <li key={p.id} className="rounded border border-border px-3 py-2">
                      <div className="font-medium">{p.label}</div>
                      <div className="text-muted-foreground">
                        {formatDate(p.startsOn)} → {formatDate(p.endsOn)}
                      </div>
                      <div className="font-mono text-xs">{p.id}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        ) : null}

        {tab === "hours" ? (
          <Card title="Post host hours">
            <form onSubmit={postHours} className="max-w-md space-y-3">
              <Input
                label="Host ID"
                required
                value={hoursForm.hostId}
                onChange={(e) => setHoursForm({ ...hoursForm, hostId: e.target.value })}
              />
              <Input
                label="Period ID"
                required
                value={hoursForm.periodId}
                onChange={(e) => setHoursForm({ ...hoursForm, periodId: e.target.value })}
              />
              <Input
                label="Live hours"
                type="number"
                required
                value={hoursForm.liveHours}
                onChange={(e) => setHoursForm({ ...hoursForm, liveHours: e.target.value })}
              />
              <Input
                label="Live days"
                type="number"
                required
                value={hoursForm.liveDays}
                onChange={(e) => setHoursForm({ ...hoursForm, liveDays: e.target.value })}
              />
              <Input
                label="Beans"
                type="number"
                value={hoursForm.beans}
                onChange={(e) => setHoursForm({ ...hoursForm, beans: e.target.value })}
              />
              <Button type="submit" disabled={busy}>
                Post
              </Button>
            </form>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
