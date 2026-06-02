"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button, Field, Select, Switch, TextInput } from "./ui/controls";
import { CATEGORIES, RECURRENCE_UNITS } from "@/lib/constants";
import { CURRENCIES } from "@/lib/currency";
import { decodeRecurrence, encodeRecurrence } from "@/lib/recurrence";
import { prefs } from "@/lib/prefs";
import { SUBSCRIPTION_DEFAULTS, type Subscription } from "@/lib/types";

function toDateInput(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromDateInput(v: string): Date | null {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function AddSubscriptionDialog({
  open,
  existing,
  defaultCurrency,
  onClose,
  onSave,
}: {
  open: boolean;
  existing: Subscription | null;
  defaultCurrency: string;
  onClose: () => void;
  onSave: (sub: Subscription) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [unit, setUnit] = useState("Monthly");
  const [frequency, setFrequency] = useState(1);
  const [category, setCategory] = useState("Entertainment");
  const [dueDate, setDueDate] = useState<string>(toDateInput(new Date()));
  const [active, setActive] = useState(true);
  const [autopay, setAutopay] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset form whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (existing) {
      const dec = decodeRecurrence(existing.recurrence);
      setName(existing.name);
      setCost(String(existing.cost));
      setCurrency(existing.currency || defaultCurrency);
      setUnit(dec.unit);
      setFrequency(dec.frequency);
      setCategory(existing.category);
      setDueDate(toDateInput(existing.dueDate));
      setActive(existing.active);
      setAutopay(existing.autopay);
    } else {
      setName("");
      setCost("");
      setCurrency(defaultCurrency);
      setUnit("Monthly");
      setFrequency(1);
      setCategory("Entertainment");
      setDueDate(toDateInput(new Date()));
      setActive(true);
      setAutopay(false);
    }
  }, [open, existing, defaultCurrency]);

  // Recompute the usage-weighted ordering each time the dialog opens.
  const categories = useMemo(
    () => prefs.personalized("category", CATEGORIES),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );
  const currencies = useMemo(
    () =>
      prefs
        .personalized("currency", CURRENCIES.map((c) => c.code))
        .map((code) => CURRENCIES.find((c) => c.code === code)!),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );

  const showFrequency = unit !== "Custom";

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const recurrence = encodeRecurrence(unit, frequency);
    const sub: Subscription = {
      ...SUBSCRIPTION_DEFAULTS,
      ...(existing?.id ? { id: existing.id } : {}),
      name: name.trim(),
      cost: parseFloat(cost) || 0,
      currency,
      recurrence,
      category,
      dueDate: fromDateInput(dueDate),
      active,
      autopay,
    };
    prefs.recordUsage("category", category);
    prefs.recordUsage("currency", currency);
    try {
      await onSave(sub);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Edit subscription" : "Add subscription"}
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={submit}
            disabled={saving || !name.trim()}
          >
            {saving ? "Saving…" : existing ? "Save" : "Add"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <Field label="Name">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Netflix"
            autoFocus
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cost">
            <TextInput
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              inputMode="decimal"
              placeholder="0"
            />
          </Field>
          <Field label="Currency">
            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} {c.symbol}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Repeats">
          <div className="flex gap-3">
            <Select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="flex-1"
            >
              {[...RECURRENCE_UNITS, "Custom"].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
            {showFrequency && (
              <div className="flex items-center gap-1 rounded-xl border border-outline bg-surface-2 px-2">
                <button
                  type="button"
                  aria-label="Decrease"
                  className="rounded-full p-1.5 disabled:opacity-30"
                  disabled={frequency <= 1}
                  onClick={() => setFrequency((f) => Math.max(1, f - 1))}
                >
                  <Minus size={16} />
                </button>
                <span className="w-6 text-center font-bold tabular-nums">
                  {frequency}
                </span>
                <button
                  type="button"
                  aria-label="Increase"
                  className="rounded-full p-1.5"
                  onClick={() => setFrequency((f) => f + 1)}
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>
        </Field>

        <Field label="Category">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Due date">
          <TextInput
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Field>

        <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
          <span className="font-semibold">Active</span>
          <Switch checked={active} onChange={setActive} />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
          <span className="font-semibold">Autopay</span>
          <Switch checked={autopay} onChange={setAutopay} />
        </div>
      </div>
    </Modal>
  );
}
