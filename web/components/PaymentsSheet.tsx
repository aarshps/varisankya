"use client";

import { useEffect, useState } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Sheet } from "./Sheet";
import { Button } from "./controls";
import {
  deletePayment,
  fetchPayments,
  recordPayment,
  updatePaymentDate,
} from "@/lib/firestore";
import { nextDueDate } from "@/lib/recurrence";
import { formatCurrency } from "@/lib/currency";
import { haptic } from "@/lib/prefs";
import { analytics } from "@/lib/analytics";
import type { PaymentRecord, Subscription } from "@/lib/types";

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
function fromDateInput(v: string): Date | null {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Manage Payments — per-subscription payment management. Mirrors the
 * Android PaymentBottomSheet / iOS PaymentSheet: pay the current bill (advances
 * the due date), add a past/extra payment (keeps the due date), and view/edit/
 * delete the recent payment history.
 */
export function PaymentsSheet({
  open,
  subscription,
  uid,
  currency,
  onClose,
}: {
  open: boolean;
  subscription: Subscription | null;
  uid: string;
  currency: string;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addDate, setAddDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<PaymentRecord | null>(null);

  const sub = subscription;
  const projectedNext = sub
    ? nextDueDate(sub.dueDate ?? new Date(), sub.recurrence)
    : null;

  const load = async () => {
    if (!sub?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setHistory(await fetchPayments(sub.id, uid, 20));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && sub) {
      analytics.paymentManageOpen();
      setAddDate(null);
      setError(null);
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sub?.id]);

  if (!sub) return null;

  const payCurrent = async () => {
    setWorking(true);
    setError(null);
    try {
      await recordPayment(sub, new Date(), projectedNext, uid);
      analytics.paymentPayCurrent();
      haptic();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const addPast = async () => {
    const d = fromDateInput(addDate ?? "");
    if (!d) return;
    setWorking(true);
    setError(null);
    try {
      await recordPayment(sub, d, null, uid); // null nextDue → keep the due date
      analytics.paymentAddOnly();
      haptic();
      setAddDate(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Manage payments">
      <div className="flex flex-col gap-4 py-2">
        <div className="rounded-2xl bg-surface-2 p-4">
          <p className="font-bold">{sub.name || "Untitled"}</p>
          <p className="text-sm text-on-surface-variant">
            Due: {fmtDate(sub.dueDate)}
          </p>
          <p className="text-sm text-on-surface-variant">
            {projectedNext
              ? `Next bill: ${fmtDate(projectedNext)}`
              : "Next due date: undefined (custom recurrence)"}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={payCurrent} disabled={working} className="w-full">
            <CheckCircle2 size={18} />
            Pay current bill — {formatCurrency(sub.cost, sub.currency || currency)}
          </Button>

          {addDate === null ? (
            <Button
              variant="tonal"
              onClick={() => setAddDate(toDateInput(new Date()))}
              disabled={working}
              className="w-full"
            >
              <CalendarPlus size={18} />
              Add a past/extra payment
            </Button>
          ) : (
            <div className="flex flex-col gap-2 rounded-2xl bg-surface-2 p-3">
              <span className="text-xs font-semibold text-on-surface-variant">
                Payment date
              </span>
              <input
                type="date"
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
                className="w-full rounded-lg border border-outline-strong bg-surface-3 px-4 py-3 text-on-surface"
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setAddDate(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={addPast}
                  disabled={working || !addDate}
                >
                  Add payment
                </Button>
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Recent payments
          </p>
          {loading ? (
            <p className="py-6 text-center text-sm text-on-surface-variant">
              Loading…
            </p>
          ) : history.length === 0 ? (
            <p className="py-6 text-center text-sm text-on-surface-variant">
              No payment history yet
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((p) => (
                <PaymentRow
                  key={p.id}
                  p={p}
                  currency={currency}
                  onEdit={() => setEditing(p)}
                  onDelete={async () => {
                    await deletePayment(p, uid);
                    analytics.paymentDelete();
                    await load();
                  }}
                />
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-sm text-error">{error}</p>}
      </div>

      {editing && (
        <EditDateInline
          payment={editing}
          onClose={() => setEditing(null)}
          onSave={async (d) => {
            await updatePaymentDate(editing, d, uid);
            analytics.paymentEditDate();
            setEditing(null);
            await load();
          }}
        />
      )}
    </Sheet>
  );
}

function PaymentRow({
  p,
  currency,
  onEdit,
  onDelete,
}: {
  p: PaymentRecord;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{fmtDate(p.date)}</p>
        <p className="text-xs text-on-surface-variant">{p.currency}</p>
      </div>
      <span className="font-bold tabular-nums">
        {formatCurrency(p.amount, p.currency || currency)}
      </span>
      <div className="relative">
        <button
          aria-label="Payment actions"
          onClick={() => setMenu((v) => !v)}
          className="rounded-full p-2 text-on-surface-variant transition hover:bg-on-surface/10"
        >
          <MoreVertical size={18} />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-2xl border border-outline bg-surface-3 py-1 text-sm shadow-lg">
              <button
                onClick={() => {
                  setMenu(false);
                  onEdit();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-on-surface/10"
              >
                <Pencil size={16} /> Edit date
              </button>
              <button
                onClick={() => {
                  setMenu(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-error transition hover:bg-on-surface/10"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

function EditDateInline({
  payment,
  onClose,
  onSave,
}: {
  payment: PaymentRecord;
  onClose: () => void;
  onSave: (d: Date) => void;
}) {
  const [v, setV] = useState(payment.date ? toDateInput(payment.date) : "");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-outline bg-surface-3 p-5 shadow-xl">
        <h3 className="text-lg font-bold">Edit payment date</h3>
        <input
          type="date"
          value={v}
          onChange={(e) => setV(e.target.value)}
          className="mt-4 w-full rounded-lg border border-outline-strong bg-surface-2 px-4 py-3 text-on-surface"
        />
        <div className="mt-4 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              const d = fromDateInput(v);
              if (d) onSave(d);
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
