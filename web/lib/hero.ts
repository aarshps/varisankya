import type { Subscription } from "./types";

export interface HeroState {
  totalAmount: number;
  nextPayment: Subscription | null;
  overdueSubscriptions: Subscription[];
  activeSubscriptions: Subscription[];
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Ports MainViewModel.calculateHero. "This month" total = active subscriptions
 * whose dueDate is overdue OR falls in the current calendar month. Uses the
 * local (gregorian) calendar, matching the native clients.
 */
export function calculateHero(allSubs: Subscription[]): HeroState {
  const active = allSubs.filter((s) => s.active && s.dueDate != null);
  const today = startOfDay(new Date());
  const curYear = today.getFullYear();
  const curMonth = today.getMonth();

  let total = 0;
  const overdue: Subscription[] = [];

  for (const sub of active) {
    if (!sub.dueDate) continue;
    const dueDay = startOfDay(sub.dueDate);
    if (dueDay.getTime() < today.getTime()) {
      overdue.push(sub);
      total += sub.cost;
    } else if (
      dueDay.getFullYear() === curYear &&
      dueDay.getMonth() === curMonth
    ) {
      total += sub.cost;
    }
  }

  const upcoming = active
    .filter((s) => s.dueDate && startOfDay(s.dueDate).getTime() >= today.getTime())
    .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()));

  return {
    totalAmount: total,
    nextPayment: upcoming[0] ?? null,
    overdueSubscriptions: overdue,
    activeSubscriptions: active,
  };
}
