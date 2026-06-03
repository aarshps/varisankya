"use client";

import { useState } from "react";
import {
  Check,
  MoreVertical,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import type { Subscription } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { daysUntilDue, isOverdue, statusText } from "@/lib/subscription";
import { haptic } from "@/lib/prefs";

interface Handlers {
  onTap: (s: Subscription) => void;
  onMarkPaid: (s: Subscription) => void;
  onToggleActive: (s: Subscription) => void;
  onDelete: (s: Subscription) => void;
}

export function SubscriptionList({
  subscriptions,
  currency,
  handlers,
}: {
  subscriptions: Subscription[];
  currency: string;
  handlers: Handlers;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {subscriptions.map((sub) => (
        <SubscriptionRow
          key={sub.id}
          sub={sub}
          currency={currency}
          handlers={handlers}
        />
      ))}
    </ul>
  );
}

function SubscriptionRow({
  sub,
  currency,
  handlers,
}: {
  sub: Subscription;
  currency: string;
  handlers: Handlers;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const overdue = sub.active && isOverdue(sub);
  const due = daysUntilDue(sub);
  const soon = sub.active && due !== null && due >= 0 && due <= 3;

  return (
    <li className="card relative flex items-center gap-3 p-3.5">
      <button
        onClick={() => handlers.onTap(sub)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-bold ${
            sub.active
              ? "bg-primary text-on-primary"
              : "bg-surface-2 text-on-surface-variant"
          }`}
        >
          {sub.name.trim().charAt(0).toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{sub.name || "Untitled"}</p>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span className="truncate">{sub.category}</span>
            <span aria-hidden>·</span>
            <span
              className={`whitespace-nowrap font-semibold ${
                overdue ? "text-red-500" : soon ? "text-on-surface" : ""
              }`}
            >
              {statusText(sub)}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-bold tabular-nums">
            {formatCurrency(sub.cost, sub.currency || currency)}
          </p>
          {sub.autopay && (
            <p className="text-[10px] font-semibold uppercase text-on-surface-variant">
              Autopay
            </p>
          )}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        {sub.active && (
          <button
            aria-label="Mark paid"
            title="Mark paid"
            onClick={() => {
              haptic();
              handlers.onMarkPaid(sub);
            }}
            className="rounded-full bg-surface-2 p-2 transition hover:bg-primary hover:text-on-primary"
          >
            <Check size={18} />
          </button>
        )}
        <div className="relative">
          <button
            aria-label="More actions"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full p-2 text-on-surface-variant transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="glass absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-2xl py-1 text-sm">
                <MenuItem
                  icon={<Pencil size={16} />}
                  label="Edit"
                  onClick={() => {
                    setMenuOpen(false);
                    handlers.onTap(sub);
                  }}
                />
                <MenuItem
                  icon={<Power size={16} />}
                  label={sub.active ? "Deactivate" : "Activate"}
                  onClick={() => {
                    setMenuOpen(false);
                    handlers.onToggleActive(sub);
                  }}
                />
                <MenuItem
                  icon={<Trash2 size={16} />}
                  label="Delete"
                  danger
                  onClick={() => {
                    setMenuOpen(false);
                    handlers.onDelete(sub);
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-black/5 dark:hover:bg-white/10 ${
        danger ? "text-red-500" : ""
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
