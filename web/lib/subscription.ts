import type { Subscription } from "./types";

/** Local (gregorian) start-of-day, matching the iOS Calendar default. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole days from today until the subscription's due date (local time). */
export function daysUntilDue(sub: Subscription): number | null {
  if (!sub.dueDate) return null;
  const today = startOfDay(new Date());
  const due = startOfDay(sub.dueDate);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function isOverdue(sub: Subscription): boolean {
  return (daysUntilDue(sub) ?? 0) < 0;
}

/** Mirrors Subscription.statusText from the iOS app. */
export function statusText(sub: Subscription): string {
  if (!sub.active) return "Inactive";
  const days = daysUntilDue(sub);
  if (days === null) return sub.recurrence;
  if (days < 0) return `${-days}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

/**
 * Sort order from FirestoreService.observeSubscriptions: active before
 * inactive, then ascending dueDate (nulls last).
 */
export function sortSubscriptions(subs: Subscription[]): Subscription[] {
  return [...subs].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return 0;
  });
}
