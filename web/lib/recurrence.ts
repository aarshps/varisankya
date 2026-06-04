/**
 * Ports ios/Varisankya/Models/Recurrence.swift — keep in sync.
 *
 * Recurrence is stored as a human string ("Monthly", "Yearly", "Weekly",
 * "Daily", "Every N Months", "Custom") so the same document reads on every
 * platform. Date math runs in **UTC** to match the native clients.
 */

export interface DecodedRecurrence {
  unit: string; // "Monthly" | "Yearly" | "Weekly" | "Daily" | "Custom"
  frequency: number;
}

export function encodeRecurrence(unit: string, frequency: number): string {
  if (unit === "Custom") return "Custom";
  if (frequency <= 1) return unit;
  const plural =
    unit === "Monthly"
      ? "Months"
      : unit === "Yearly"
        ? "Years"
        : unit === "Weekly"
          ? "Weeks"
          : unit === "Daily"
            ? "Days"
            : unit;
  return `Every ${frequency} ${plural}`;
}

export function decodeRecurrence(raw: string): DecodedRecurrence {
  if (raw === "Custom") return { unit: "Custom", frequency: 1 };
  if (raw.startsWith("Every ")) {
    const parts = raw.split(" ");
    if (parts.length >= 3) {
      const freq = parseInt(parts[1], 10);
      if (!Number.isNaN(freq)) {
        const unit = unitFromPlural(parts[2]);
        return { unit, frequency: freq };
      }
    }
  }
  return { unit: raw, frequency: 1 };
}

function unitFromPlural(token: string): string {
  switch (token) {
    case "Months":
    case "Month":
      return "Monthly";
    case "Years":
    case "Year":
      return "Yearly";
    case "Weeks":
    case "Week":
      return "Weekly";
    case "Days":
    case "Day":
      return "Daily";
    default:
      return "Monthly";
  }
}

type Component = "month" | "year" | "week" | "day";

function componentFromToken(token: string): Component {
  switch (token) {
    case "Months":
    case "Month":
      return "month";
    case "Years":
    case "Year":
      return "year";
    case "Weeks":
    case "Week":
      return "week";
    case "Days":
    case "Day":
      return "day";
    default:
      return "month";
  }
}

function componentFromPreset(recurrence: string): Component {
  switch (recurrence) {
    case "Monthly":
      return "month";
    case "Yearly":
      return "year";
    case "Weekly":
      return "week";
    case "Daily":
      return "day";
    default:
      return "month";
  }
}

/** UTC start-of-day. */
function utcStartOfDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/**
 * Adds `value` of `component` to a UTC date, clamping the day-of-month the way
 * Foundation's Calendar does (e.g. Jan 31 + 1 month = Feb 28, not Mar 3).
 */
function addComponent(date: Date, component: Component, value: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();

  if (component === "day") {
    return new Date(Date.UTC(y, m, d + value));
  }
  if (component === "week") {
    return new Date(Date.UTC(y, m, d + value * 7));
  }
  if (component === "year") {
    return clampedYMD(y + value, m, d);
  }
  // month
  const total = m + value;
  const newYear = y + Math.floor(total / 12);
  const newMonth = ((total % 12) + 12) % 12;
  return clampedYMD(newYear, newMonth, d);
}

/** Builds a UTC date, clamping day to the last valid day of the target month. */
function clampedYMD(year: number, month: number, day: number): Date {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, daysInMonth)));
}

/**
 * Returns the next due date for a recurrence, or null for "Custom".
 * Mirrors RecurrenceHelper.nextDueDate (UTC math).
 */
export function nextDueDate(baseDate: Date, recurrence: string): Date | null {
  if (recurrence === "Custom") return null;
  const start = utcStartOfDay(baseDate);

  if (recurrence.startsWith("Every ")) {
    const parts = recurrence.split(" ");
    if (parts.length < 3) return start;
    const freq = parseInt(parts[1], 10);
    if (Number.isNaN(freq)) return start;
    return addComponent(start, componentFromToken(parts[2]), freq);
  }

  return addComponent(start, componentFromPreset(recurrence), 1);
}
