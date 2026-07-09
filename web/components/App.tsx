"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Search, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { prefs } from "@/lib/prefs";
import { haptics } from "@/lib/haptics";
import { analytics } from "@/lib/analytics";
import { nextDueDate } from "@/lib/recurrence";
import {
  deleteSubscription,
  recordPayment,
  setActive,
  upsertSubscription,
} from "@/lib/firestore";
import type { Subscription } from "@/lib/types";
import { Hero } from "./Hero";
import { SubscriptionList } from "./SubscriptionList";
import { AddSubscriptionDialog } from "./AddSubscriptionDialog";
import { SearchDialog } from "./SearchDialog";
import { SettingsView } from "./SettingsView";
import { HistoryView } from "./HistoryView";
import { ConfirmDialog } from "./ConfirmDialog";
import { PaymentsSheet } from "./PaymentsSheet";
import { EmptyState } from "./EmptyState";
import { AppBar } from "./AppBar";
import { Fab } from "./Fab";

export function App() {
  const { user } = useAuth();
  const uid = user?.uid;
  const { subscriptions, hero, loading } = useSubscriptions(uid);

  const [currency, setCurrency] = useState(prefs.getCurrency());
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Subscription | null>(null);
  const [managing, setManaging] = useState<Subscription | null>(null);

  const openAdd = () => {
    setEditing(null);
    setShowAdd(true);
    analytics.subscriptionAddOpen();
  };
  const openEdit = (s: Subscription) => {
    setEditing(s);
    setShowAdd(true);
    analytics.subscriptionEditOpen();
  };

  const handleSave = async (sub: Subscription) => {
    if (!uid) return;
    const isNew = !sub.id;
    analytics.subscriptionSave(isNew, sub.recurrence);

    // Optimistic pattern: fire write asynchronously, return immediately.
    // Firestore latency compensation updates the local cache; snapshot
    // listeners auto-refresh the UI. Errors are handled non-blocking.
    upsertSubscription(sub, uid).catch((err) => {
      console.error("Failed to save subscription:", err);
      // TODO: show toast/alert to user
    });
  };

  const handleMarkPaid = async (sub: Subscription) => {
    if (!uid) return;
    const next = nextDueDate(sub.dueDate ?? new Date(), sub.recurrence);
    analytics.paymentMarkPaidSwipe();

    // Optimistic pattern: fire write asynchronously, return immediately.
    recordPayment(sub, new Date(), next, uid).catch((err) => {
      console.error("Failed to record payment:", err);
      // TODO: show toast/alert to user
    });
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28">
      {/* Header */}
      <AppBar
        title="Varisankya"
        leading={
          <button
            onClick={() => {
              setShowSettings(true);
              analytics.screenSettingsOpen();
            }}
            aria-label="Settings"
            className="overflow-hidden rounded-full border border-outline"
          >
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt=""
                width={36}
                height={36}
                unoptimized
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center bg-surface-2 text-on-surface-variant">
                <User size={18} />
              </span>
            )}
          </button>
        }
        actions={
          <button
            onClick={() => {
              setShowSearch(true);
              analytics.screenSearchOpen();
            }}
            aria-label="Search"
            className="rounded-full bg-surface-2 p-2.5 transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Search size={20} />
          </button>
        }
      />

      <div className="flex flex-col gap-5 pt-2">
        <Hero
          hero={hero}
          currency={currency}
          onOpenHistory={() => {
            setShowHistory(true);
            analytics.screenAllPaymentsOpen();
          }}
        />

        {loading && subscriptions.length === 0 ? (
          <LoadingSkeleton />
        ) : subscriptions.length === 0 ? (
          <EmptyState
            icon={<Plus size={28} className="text-on-surface-variant" />}
            title="No subscriptions yet"
            description="Add your first recurring payment to start tracking."
            actionLabel="Add subscription"
            onAction={openAdd}
          />
        ) : (
          <SubscriptionList
            subscriptions={subscriptions}
            currency={currency}
            handlers={{
              onTap: openEdit,
              onMarkPaid: handleMarkPaid,
              onManagePayments: (s) => setManaging(s),
              onToggleActive: (s) => {
                if (!uid) return;
                setActive(s, !s.active, uid);
                analytics.subscriptionStatusChange(!s.active);
              },
              onDelete: (s) => setPendingDelete(s),
            }}
          />
        )}
      </div>

      {/* FAB */}
      <Fab
        icon={<Plus size={20} />}
        label="Add"
        onClick={() => {
          haptics.click();
          openAdd();
        }}
      />

      {/* Dialogs & overlays */}
      <AddSubscriptionDialog
        open={showAdd}
        existing={editing}
        defaultCurrency={currency}
        onClose={() => setShowAdd(false)}
        onSave={handleSave}
      />

      <SearchDialog
        open={showSearch}
        subscriptions={subscriptions}
        currency={currency}
        onClose={() => setShowSearch(false)}
        onSelect={openEdit}
      />

      {showSettings && (
        <SettingsView
          currency={currency}
          onCurrencyChange={setCurrency}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showHistory && uid && (
        <HistoryView
          uid={uid}
          currency={currency}
          onClose={() => setShowHistory(false)}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        danger
        title="Delete subscription?"
        message={`"${pendingDelete?.name ?? ""}" and its payment history stay, but the subscription will be removed. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (uid && pendingDelete) {
            analytics.subscriptionDelete();
            // Optimistic pattern: fire delete asynchronously, close dialog immediately.
            deleteSubscription(pendingDelete, uid).catch((err) => {
              console.error("Failed to delete subscription:", err);
              // TODO: show toast/alert to user
            });
          }
          setPendingDelete(null);
        }}
        onClose={() => setPendingDelete(null)}
      />

      {uid && (
        <PaymentsSheet
          open={managing !== null}
          subscription={managing}
          uid={uid}
          currency={currency}
          onClose={() => setManaging(null)}
        />
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card h-[68px] animate-pulse bg-surface-2" />
      ))}
    </div>
  );
}
