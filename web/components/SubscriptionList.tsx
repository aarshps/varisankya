"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  MoreVertical,
  Pencil,
  Power,
  Receipt,
  Trash2,
} from "lucide-react";
import type { Subscription } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { daysUntilDue, isOverdue, statusText } from "@/lib/subscription";
import { haptics } from "@/lib/haptics";

interface Handlers {
  onTap: (s: Subscription) => void;
  onMarkPaid: (s: Subscription) => void;
  onManagePayments: (s: Subscription) => void;
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
    <ul className="grouped-list">
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

const SWIPE_MAX = 96;
const SWIPE_THRESHOLD = 72;

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
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null,
  );
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Swipe-to-mark-paid (Android's signature gesture). Right-swipe past the
  // threshold marks paid; the ✓ button remains as a fallback.
  const [dx, setDx] = useState(0);
  const [animating, setAnimating] = useState(true);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const movedRef = useRef(false);

  const overdue = sub.active && isOverdue(sub);
  const due = daysUntilDue(sub);
  const soon = sub.active && due !== null && due >= 0 && due <= 3;
  const canSwipe = sub.active;

  const pillClass = !sub.active
    ? "pill-inactive"
    : overdue
      ? "pill-overdue"
      : soon
        ? "pill-active"
        : "pill-inactive";

  const onPointerDown = (e: React.PointerEvent) => {
    if (!canSwipe) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    movedRef.current = false;
    setAnimating(false);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 6) movedRef.current = true;
    setDx(Math.max(0, Math.min(SWIPE_MAX, delta)));
  };
  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setAnimating(true);
    const reached = dx >= SWIPE_THRESHOLD;
    setDx(0);
    if (reached) {
      haptics.click();
      handlers.onMarkPaid(sub);
    }
    // Let the click that follows pointerup read movedRef, then clear it.
    window.setTimeout(() => {
      movedRef.current = false;
    }, 60);
  };
  const tapped = (fn: () => void) => () => {
    if (movedRef.current) return;
    fn();
  };

  const openMenu = () => {
    if (movedRef.current) return;
    const r = menuBtnRef.current?.getBoundingClientRect();
    if (r) setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    setMenuOpen(true);
  };

  return (
    <li
      className={`relative overflow-hidden bg-surface ${POSITION_CLASS[position]}`}
    >
      {canSwipe && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center gap-2 bg-primary px-5 text-on-primary"
          style={{ opacity: dx > 0 ? 1 : 0 }}
        >
          <Check size={20} />
          <span className="text-sm font-semibold">Mark paid</span>
        </div>
      )}

      <div
        className="relative flex items-center gap-3 bg-surface p-3.5"
        style={{
          transform: `translateX(${dx}px)`,
          transition: animating ? "transform 0.2s ease" : "none",
          touchAction: "pan-y",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <button
          onClick={tapped(() => handlers.onTap(sub))}
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
              onClick={tapped(() => {
                haptics.click();
                handlers.onMarkPaid(sub);
              })}
              className="rounded-full bg-secondary-container p-2 text-on-secondary-container transition hover:opacity-90"
            >
              <Check size={18} />
            </button>
          )}
          <button
            ref={menuBtnRef}
            aria-label="More actions"
            onClick={openMenu}
            className="rounded-full p-2 text-on-surface-variant transition hover:bg-on-surface/10"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {menuOpen &&
        menuPos &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[55]"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="fixed z-[56] w-44 overflow-hidden rounded-2xl border border-outline bg-surface-3 py-1 text-sm shadow-lg"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <MenuItem
                icon={<Pencil size={16} />}
                label="Edit"
                onClick={() => {
                  setMenuOpen(false);
                  handlers.onTap(sub);
                }}
              />
              <MenuItem
                icon={<Receipt size={16} />}
                label="Payments"
                onClick={() => {
                  setMenuOpen(false);
                  handlers.onManagePayments(sub);
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
          </>,
          document.body,
        )}
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
