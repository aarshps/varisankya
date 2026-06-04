/**
 * localStorage-backed preferences, mirroring the keys in
 * ios/Varisankya/Services/Preferences.swift. SSR-safe: every getter
 * guards against `window` being undefined.
 */

const KEY = {
  haptics: "haptics_enabled",
  notifHour: "notification_hour",
  notifMinute: "notification_minute",
  notifDays: "notification_days",
  useGoogleFont: "use_google_font",
  defaultPaymentView: "default_payment_view",
  paymentViewMode: "payment_view_mode",
  currency: "app_currency",
  appearance: "appearance_mode",
} as const;

export type Appearance = "system" | "light" | "dark";

function get(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}
function set(key: string, value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}
function getBool(key: string, fallback: boolean): boolean {
  const v = get(key);
  return v === null ? fallback : v === "true";
}
function getInt(key: string, fallback: number): number {
  const v = get(key);
  if (v === null) return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

export const prefs = {
  getCurrency: (): string => get(KEY.currency) ?? "INR",
  setCurrency: (v: string) => set(KEY.currency, v),

  getAppearance: (): Appearance =>
    (get(KEY.appearance) as Appearance | null) ?? "system",
  setAppearance: (v: Appearance) => set(KEY.appearance, v),

  getUseGoogleFont: (): boolean => getBool(KEY.useGoogleFont, true),
  setUseGoogleFont: (v: boolean) => set(KEY.useGoogleFont, String(v)),

  getHaptics: (): boolean => getBool(KEY.haptics, true),
  setHaptics: (v: boolean) => set(KEY.haptics, String(v)),

  getNotificationHour: (): number => getInt(KEY.notifHour, 8),
  getNotificationMinute: (): number => getInt(KEY.notifMinute, 0),
  setNotificationTime: (hour: number, minute: number) => {
    set(KEY.notifHour, String(hour));
    set(KEY.notifMinute, String(minute));
  },

  getNotificationDays: (): number => getInt(KEY.notifDays, 7),
  setNotificationDays: (v: number) => set(KEY.notifDays, String(v)),

  getPaymentViewMode: (): string =>
    get(KEY.paymentViewMode) ?? get(KEY.defaultPaymentView) ?? "chart",
  setPaymentViewMode: (v: string) => set(KEY.paymentViewMode, v),

  // Usage-weighted dropdown ordering (mirrors Preferences.personalized).
  recordUsage: (prefix: string, value: string) => {
    const k = `usage_${prefix}_${value}`;
    set(k, String(getInt(k, 0) + 1));
  },
  personalized: (prefix: string, defaultList: string[]): string[] => {
    return [...defaultList].sort(
      (a, b) =>
        getInt(`usage_${prefix}_${b}`, 0) - getInt(`usage_${prefix}_${a}`, 0),
    );
  },
};

/** Fire a short vibration when haptics are enabled and supported. */
export function haptic(pattern: number | number[] = 10) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  if (!prefs.getHaptics()) return;
  navigator.vibrate(pattern);
}
