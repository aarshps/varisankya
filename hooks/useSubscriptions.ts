"use client";

import { useEffect, useMemo, useState } from "react";
import { observeSubscriptions } from "@/lib/firestore";
import { calculateHero, type HeroState } from "@/lib/hero";
import type { Subscription } from "@/lib/types";

interface SubscriptionsState {
  subscriptions: Subscription[];
  hero: HeroState;
  loading: boolean;
  error: string | null;
}

export function useSubscriptions(uid: string | undefined): SubscriptionsState {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = observeSubscriptions(
      uid,
      (subs) => {
        setSubscriptions(subs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [uid]);

  const hero = useMemo(() => calculateHero(subscriptions), [subscriptions]);

  return { subscriptions, hero, loading, error };
}
