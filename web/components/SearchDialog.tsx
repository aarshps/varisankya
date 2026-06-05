"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "./ui/Modal";
import { TextInput } from "./ui/controls";
import { CATEGORIES } from "@/lib/constants";
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
  const [cat, setCat] = useState("All");

  // Only show category chips that actually occur (avoids a wall of empty filters),
  // in the canonical category order — mirrors Android's search filter chips.
  const categories = useMemo(() => {
    const present = new Set(
      subscriptions.map((s) => s.category).filter(Boolean),
    );
    return ["All", ...CATEGORIES.filter((c) => present.has(c))];
  }, [subscriptions]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return subscriptions.filter((s) => {
      const matchesText =
        !term ||
        s.name.toLowerCase().includes(term) ||
        s.category.toLowerCase().includes(term);
      const matchesCat = cat === "All" || s.category === cat;
      return matchesText && matchesCat;
    });
  }, [q, cat, subscriptions]);

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
            placeholder="Search by name or category"
            className="pl-10"
          />
        </div>

        {categories.length > 1 && (
          <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`chip shrink-0 ${cat === c ? "chip-selected" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

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
                    {s.category} · {statusText(s)}
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
