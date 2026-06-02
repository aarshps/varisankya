"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Search, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { prefs, haptic } from "@/lib/prefs";
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
import { ConfirmDialog } from "./ui/ConfirmDialog";

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

  const openAdd = () => {
    setEditing(null);
    setShowAdd(true);
  };
  const openEdit = (s: Subscription) => {
    setEditing(s);
    setShowAdd(true);
  };

  const handleSave = async (sub: Subscription) => {
    if (!uid) return;
    await upsertSubscription(sub, uid);
  };

  const handleMarkPaid = async (sub: Subscription) => {
    if (!uid) return;
    const next = nextDueDate(sub.dueDate ?? new Date(), sub.recurrence);
    await recordPayment(sub, new Date(), next, uid);
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20 -mx-4 mb-2 flex items-center gap-2 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => setShowSettings(true)}
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
        <h1 className="flex-1 text-2xl font-extrabold">Varisankya</h1>
        <button
          onClick={() => setShowSearch(true)}
          aria-label="Search"
          className="rounded-full bg-surface-2 p-2.5 transition hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Search size={20} />
        </button>
      </header>

      <div className="flex flex-col gap-5 pt-2">
        <Hero
          hero={hero}
          currency={currency}
          onOpenHistory={() => setShowHistory(true)}
        />

        {loading && subscriptions.length === 0 ? (
          <LoadingSkeleton />
        ) : subscriptions.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : (
          <SubscriptionList
            subscriptions={subscriptions}
            currency={currency}
            handlers={{
              onTap: openEdit,
              onMarkPaid: handleMarkPaid,
              onToggleActive: (s) => uid && setActive(s, !s.active, uid),
              onDelete: (s) => setPendingDelete(s),
            }}
          />
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => {
          haptic();
          openAdd();
        }}
        className="fixed right-5 bottom-6 z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 font-semibold text-on-primary shadow-lg transition hover:opacity-90"
      >
        <Plus size={20} />
        Add
      </button>

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
          if (uid && pendingDelete) await deleteSubscription(pendingDelete, uid);
          setPendingDelete(null);
        }}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-surface-2">
        <Plus size={28} className="text-on-surface-variant" />
      </div>
      <div>
        <p className="text-lg font-bold">No subscriptions yet</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          Add your first recurring payment to start tracking.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="rounded-full bg-primary px-6 py-2.5 font-semibold text-on-primary"
      >
        Add subscription
      </button>
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
