import { describe, it, expect } from "vitest";
import {
  decodeRecurrence,
  encodeRecurrence,
  nextDueDate,
} from "../recurrence";
import { compactFormat, formatCurrency } from "../currency";
import { calculateHero } from "../hero";
import type { Subscription } from "../types";

const utc = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d));

describe("recurrence encode/decode", () => {
  it("encodes presets and 'Every N' forms", () => {
    expect(encodeRecurrence("Monthly", 1)).toBe("Monthly");
    expect(encodeRecurrence("Monthly", 3)).toBe("Every 3 Months");
    expect(encodeRecurrence("Yearly", 2)).toBe("Every 2 Years");
    expect(encodeRecurrence("Custom", 5)).toBe("Custom");
  });

  it("decodes round-trip", () => {
    expect(decodeRecurrence("Monthly")).toEqual({ unit: "Monthly", frequency: 1 });
    expect(decodeRecurrence("Every 3 Months")).toEqual({
      unit: "Monthly",
      frequency: 3,
    });
    expect(decodeRecurrence("Custom")).toEqual({ unit: "Custom", frequency: 1 });
  });
});

describe("nextDueDate (UTC math, matching iOS)", () => {
  it("advances by preset unit", () => {
    expect(nextDueDate(utc(2026, 1, 15), "Monthly")).toEqual(utc(2026, 2, 15));
    expect(nextDueDate(utc(2026, 1, 15), "Yearly")).toEqual(utc(2027, 1, 15));
    expect(nextDueDate(utc(2026, 1, 15), "Weekly")).toEqual(utc(2026, 1, 22));
    expect(nextDueDate(utc(2026, 1, 15), "Daily")).toEqual(utc(2026, 1, 16));
  });

  it("advances by 'Every N' forms", () => {
    expect(nextDueDate(utc(2026, 1, 15), "Every 3 Months")).toEqual(
      utc(2026, 4, 15),
    );
  });

  it("clamps end-of-month like Foundation (Jan 31 + 1mo = Feb 28)", () => {
    expect(nextDueDate(utc(2026, 1, 31), "Monthly")).toEqual(utc(2026, 2, 28));
  });

  it("returns null for Custom", () => {
    expect(nextDueDate(utc(2026, 1, 15), "Custom")).toBeNull();
  });
});

describe("currency formatting", () => {
  it("formats whole vs fractional", () => {
    expect(formatCurrency(649, "INR")).toBe("₹ 649");
    expect(formatCurrency(9.99, "USD")).toBe("$ 9.99");
  });
  it("compact form uses k / l / m", () => {
    expect(compactFormat(999)).toBe("999");
    expect(compactFormat(1500)).toBe("1.5k");
    expect(compactFormat(250000)).toBe("2.5l");
    expect(compactFormat(3000000)).toBe("3m");
    expect(compactFormat(0)).toBe("0");
  });
});

describe("hero math", () => {
  const base: Omit<Subscription, "dueDate" | "cost"> = {
    name: "x",
    currency: "INR",
    recurrence: "Monthly",
    active: true,
    autopay: false,
  };

  it("sums overdue + this-month, picks next upcoming, lists overdue", () => {
    const today = new Date();
    const local = (offsetDays: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offsetDays);
      return d;
    };
    const subs: Subscription[] = [
      { ...base, cost: 100, dueDate: local(-2) }, // overdue
      { ...base, cost: 200, dueDate: local(3) }, // this month-ish (upcoming)
      { ...base, cost: 50, dueDate: local(400), active: true }, // far future
      { ...base, cost: 999, dueDate: local(1), active: false }, // inactive ignored
    ];
    const hero = calculateHero(subs);
    expect(hero.overdueSubscriptions).toHaveLength(1);
    expect(hero.nextPayment?.cost).toBe(200);
    expect(hero.totalAmount).toBeGreaterThanOrEqual(100); // overdue always counts
  });
});
