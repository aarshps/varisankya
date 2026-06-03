import type { Timestamp } from "firebase/firestore";

/**
 * Mirrors the Android/iOS Subscription document at
 * users/{uid}/subscriptions/{sid}. Field names and defaults must match the
 * native clients exactly so the same document round-trips on every platform.
 */
export interface Subscription {
  id?: string;
  name: string;
  dueDate: Date | null;
  cost: number;
  currency: string;
  recurrence: string;
  category: string;
  active: boolean;
  autopay: boolean;
}

/**
 * Mirrors the PaymentRecord document. Written to both the nested
 * (authoritative) collection and the flat mirror.
 */
export interface PaymentRecord {
  id?: string;
  date: Date | null;
  amount: number;
  subscriptionName: string;
  subscriptionId: string;
  currency: string;
  userId: string;
}

/** Raw Firestore shapes (Timestamps before conversion). */
export interface SubscriptionDoc {
  name?: string;
  dueDate?: Timestamp | null;
  cost?: number;
  currency?: string;
  recurrence?: string;
  category?: string;
  active?: boolean;
  autopay?: boolean;
}

export interface PaymentDoc {
  date?: Timestamp | null;
  amount?: number;
  subscriptionName?: string;
  subscriptionId?: string;
  currency?: string;
  userId?: string;
}

export const SUBSCRIPTION_DEFAULTS: Omit<Subscription, "id"> = {
  name: "",
  dueDate: null,
  cost: 0,
  currency: "USD",
  recurrence: "Monthly",
  category: "Entertainment",
  active: true,
  autopay: false,
};
