"use client";

import { ChevronRight, AlertCircle, CalendarClock } from "lucide-react";
import type { HeroState } from "@/lib/hero";
import { formatCurrency } from "@/lib/currency";
import { statusText } from "@/lib/subscription";

export function Hero({
  hero,
  currency,
  onOpenHistory,
}: {
  hero: HeroState;
  currency: string;
  onOpenHistory: () => void;
}) {
  const { totalAmount, nextPayment, overdueSubscriptions } = hero;
  return (
    <button
      onClick={onOpenHistory}
      className="card w-full overflow-hidden p-[22px] text-left transition active:scale-[0.995]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.15em] text-primary uppercase">
            This month
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
            {formatCurrency(totalAmount, currency)}
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
          History <ChevronRight size={14} />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-container p-3.5">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <CalendarClock size={15} />
            <span className="text-xs font-semibold">Next payment</span>
          </div>
          {nextPayment ? (
            <>
              <p className="mt-1 truncate text-sm font-bold">
                {nextPayment.name}
              </p>
              <p className="text-xs text-on-surface-variant">
                {statusText(nextPayment)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-on-surface-variant">None</p>
          )}
        </div>

        <div className="rounded-2xl bg-surface-container p-3.5">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <AlertCircle size={15} />
            <span className="text-xs font-semibold">Overdue</span>
          </div>
          <p className="mt-1 text-sm font-bold">
            {overdueSubscriptions.length}
          </p>
          <p className="text-xs text-on-surface-variant">
            {overdueSubscriptions.length === 1 ? "subscription" : "subscriptions"}
          </p>
        </div>
      </div>
    </button>
  );
}
