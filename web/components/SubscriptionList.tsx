"use client";

import { useState } from "react";
import { Check, MoreVertical, Pencil, Power, Trash2 } from "lucide-react";
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

type Position = "single" | "first" | "middle" | "last";

const POSITION_CLASS: Record<Position, string> = {
  single: "item-single",
  first: "item-first",
  middle: "item-middle",
  last: "item-last",
};

export function SubscriptionList({
  subscriptions,
  currency,
  handlers,
}: {
  subscriptions: Subscription[];
  currency: string;
  handlers: Handlers;
}) {
  const n = subscriptions.length;
  // Grouped-list shapes: N cards read as one continuous surface — mirrors the
  // Android SubscriptionAdapter first/middle/last/single corner pattern.
  return (
    <ul className="flex flex-col gap-0.5">
      {subscriptions.map((sub, i) => {
        const position: Position =
          n === 1 ? "single" : i === 0 ? "first" : i === n - 1 ? "last" : "middle";
        return (
          <SubscriptionRow
            key={sub.id}
            sub={sub}
            currency={currency}
            position={position}
            handlers={handlers}
          />
        );
      })}
    </ul>
  );
}

function SubscriptionRow({
  sub,
  currency,
  position,
  handlers,
}: {
  sub: Subscription;
  currency: string;
  position: Position;
  handlers: Handlers;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const overdue = sub.active && isOverdue(sub);
  const due = daysUntilDue(sub);
  const soon = sub.active && due !== null && due >= 0 && due <= 3;

  // M3 semantic status pill (Android: overdue=errorContainer, active=primary, inactive=surfaceVariant).
  const pillClass = !sub.active
    ? "pill-inactive"
    : overdue
      ? "pill-overdue"
      : soon
        ? "pill-active"
        : "pill-inactive";

  return (
    <li
      className={`relative flex items-center gap-3 bg-surface p-3.5 ${POSITION_CLASS[position]}`}
    >
      <button
        onClick={() => handlers.onTap(sub)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-bold ${
            sub.active
              ? "bg-primary-container text-on-primary-container"
              : "bg-surface-3 text-on-surface-variant"
          }`}
        >
          {sub.name.trim().charAt(0).toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{sub.name || "Untitled"}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span className="truncate">{sub.category}</span>
            <span aria-hidden>·</span>
            <span
              className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${pillClass}`}
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
            className="rounded-full bg-secondary-container p-2 text-on-secondary-container transition hover:opacity-90"
          >
            <Check size={18} />
          </button>
        )}
        <div className="relative">
          <button
            aria-label="More actions"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full p-2 text-on-surface-variant transition hover:bg-on-surface/10"
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-2xl border border-outline bg-surface-3 py-1 text-sm shadow-lg">
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
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-on-surface/10 ${
        danger ? "text-error" : ""
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
