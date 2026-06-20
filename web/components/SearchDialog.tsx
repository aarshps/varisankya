"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "./ui/Modal";
import { TextInput } from "./ui/controls";
import { formatCurrency } from "@/lib/currency";
import { statusText } from "@/lib/subscription";
import type { Subscription } from "@/lib/types";

export function SearchDialog({
  open,
  subscriptions,
  currency,
  onClose,
  onSelect,
}: {
  open: boolean;
  subscriptions: Subscription[];
  currency: string;
  onClose: () => void;
  onSelect: (s: Subscription) => void;
}) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return subscriptions.filter(
      (s) => !term || s.name.toLowerCase().includes(term),
    );
  }, [q, subscriptions]);

  return (
    <Modal open={open} onClose={onClose} title="Search">
      <div className="py-1">
        <div className="relative">
          <Search
            size={18}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant"
          />
          <TextInput
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name"
            className="pl-10"
          />
        </div>

        <ul className="mt-3 flex flex-col gap-2">
          {results.length === 0 && (
            <li className="py-8 text-center text-sm text-on-surface-variant">
              No matches
            </li>
          )}
          {results.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => {
                  onSelect(s);
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-2xl bg-surface-2 px-4 py-3 text-left transition hover:bg-on-surface/10"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">{s.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {statusText(s)}
                  </p>
                </div>
                <span className="font-bold tabular-nums">
                  {formatCurrency(s.cost, s.currency || currency)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
