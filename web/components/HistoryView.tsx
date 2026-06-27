"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  List as ListIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import { ScreenHeader } from "./ScreenHeader";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  deletePayment,
  fetchAllPayments,
  updatePaymentDate,
} from "@/lib/firestore";
import { compactFormat, formatCurrency } from "@/lib/currency";
import { prefs } from "@/lib/prefs";
import { analytics } from "@/lib/analytics";
import type { PaymentRecord } from "@/lib/types";

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}
function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function HistoryView({
  uid,
  currency,
  onClose,
}: {
  uid: string;
  currency: string;
  onClose: () => void;
}) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<string>(prefs.getPaymentViewMode());
  const [editing, setEditing] = useState<PaymentRecord | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setPayments(await fetchAllPayments(uid));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const setView = (m: string) => {
    setMode(m);
    prefs.setPaymentViewMode(m);
  };

  const chartData = useMemo(() => {
    const buckets = new Map<string, { label: string; total: number }>();
    for (const p of payments) {
      if (!p.date) continue;
      const key = monthKey(p.date);
      const entry = buckets.get(key) ?? { label: monthLabel(p.date), total: 0 };
      entry.total += p.amount;
      buckets.set(key, entry);
    }
    return [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v);
  }, [payments]);

  const total = useMemo(
    () => payments.reduce((s, p) => s + p.amount, 0),
    [payments],
  );

  // Average monthly spend, robust to outlier months via Tukey's IQR fence —
  // mirrors the Android/iOS history hero stat.
  const avgMonthly = useMemo(() => {
    const vals = chartData
      .map((d) => d.total)
      .filter((v) => v > 0)
      .sort((a, b) => a - b);
    if (vals.length === 0) return 0;
    if (vals.length < 4) return vals.reduce((s, v) => s + v, 0) / vals.length;
    const q = (p: number) => {
      const i = (vals.length - 1) * p;
      const lo = Math.floor(i);
      const hi = Math.ceil(i);
      return vals[lo] + (vals[hi] - vals[lo]) * (i - lo);
    };
    const q1 = q(0.25);
    const q3 = q(0.75);
    const iqr = q3 - q1;
    const kept = vals.filter((v) => v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr);
    const arr = kept.length ? kept : vals;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }, [chartData]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      <ScreenHeader
        title="Payment history"
        onBack={onClose}
        trailing={
          <div className="flex rounded-full bg-surface-2 p-1">
            <ToggleBtn
              active={mode === "chart"}
              onClick={() => setView("chart")}
              label="Chart"
            >
              <BarChart3 size={16} />
            </ToggleBtn>
            <ToggleBtn
              active={mode === "list"}
              onClick={() => setView("list")}
              label="List"
            >
              <ListIcon size={16} />
            </ToggleBtn>
          </div>
        }
      />

      <div className="no-scrollbar mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-4">
        <div className="card mb-4 grid grid-cols-2 gap-4 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              All-time total
            </p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums">
              {formatCurrency(total, currency)}
            </p>
            <p className="text-xs text-on-surface-variant">
              {payments.length} payments
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Avg / month
            </p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums">
              {formatCurrency(avgMonthly, currency)}
            </p>
            <p className="text-xs text-on-surface-variant">
              across {chartData.length}{" "}
              {chartData.length === 1 ? "month" : "months"}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-on-surface-variant">
            Loading…
          </p>
        ) : payments.length === 0 ? (
          <p className="py-12 text-center text-sm text-on-surface-variant">
            No payments recorded yet.
          </p>
        ) : mode === "chart" ? (
          <div className="card p-4" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => compactFormat(v as number)}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(v as number, currency)}
                  cursor={{ fill: "rgba(128,128,128,0.1)" }}
                />
                <Bar
                  dataKey="total"
                  fill="var(--primary)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {payments.map((p) => (
              <li
                key={p.id}
                className="card flex items-center gap-3 p-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{p.subscriptionName}</p>
                  <p className="text-xs text-on-surface-variant">
                    {p.date
                      ? p.date.toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                <span className="font-bold tabular-nums">
                  {formatCurrency(p.amount, p.currency || currency)}
                </span>
                <button
                  aria-label="Edit date"
                  onClick={() => setEditing(p)}
                  className="rounded-full p-2 text-on-surface-variant transition hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Pencil size={16} />
                </button>
                <button
                  aria-label="Delete"
                  onClick={async () => {
                    await deletePayment(p, uid);
                    analytics.paymentDelete();
                    void load();
                  }}
                  className="rounded-full p-2 text-error transition hover:bg-error/10"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <EditDateOverlay
          payment={editing}
          onClose={() => setEditing(null)}
          onSave={async (newDate) => {
            await updatePaymentDate(editing, newDate, uid);
            analytics.paymentEditDate();
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-primary text-on-primary" : "text-on-surface-variant"
      }`}
    >
      {children}
    </button>
  );
}

function EditDateOverlay({
  payment,
  onClose,
  onSave,
}: {
  payment: PaymentRecord;
  onClose: () => void;
  onSave: (d: Date) => void;
}) {
  const [value, setValue] = useState(
    payment.date ? toDateInput(payment.date) : "",
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-outline bg-surface-3 p-5 shadow-xl">
        <h3 className="text-lg font-bold">Edit payment date</h3>
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-4 w-full rounded-xl border border-outline bg-surface-2 px-4 py-3"
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full px-5 py-2.5 font-semibold hover:bg-black/5 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!value) return;
              const [y, m, d] = value.split("-").map(Number);
              onSave(new Date(y, m - 1, d));
            }}
            className="flex-1 rounded-full bg-primary px-5 py-2.5 font-semibold text-on-primary"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
