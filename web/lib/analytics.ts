"use client";

import { logEvent, type Analytics } from "firebase/analytics";
import { getAnalyticsClient } from "./firebase";

/**
 * Thin wrapper around Firebase Analytics. Mirrors the Android/iOS `AppAnalytics`
 * surface 1:1 so dashboards stay readable across platforms.
 *
 * Invariant: scalar params only — no subscription names, amounts, or document
 * IDs (Firebase Analytics caps text params at 40 distinct values).
 *
 * Analytics is best-effort and browser-only; every call no-ops on the server or
 * when measurement isn't supported/configured.
 */
function track(event: string, params?: Record<string, unknown>): void {
  const a: Analytics | null = getAnalyticsClient();
  if (!a) return;
  try {
    logEvent(a, event, params);
  } catch {
    // never let analytics break a user action
  }
}

export const analytics = {
  // Subscription flows
  subscriptionAddOpen: () => track("subscription_add_open"),
  subscriptionEditOpen: () => track("subscription_edit_open"),
  subscriptionSave: (isNew: boolean, recurrence: string) =>
    track("subscription_save", { is_new: isNew, recurrence }),
  subscriptionDelete: () => track("subscription_delete"),
  subscriptionStatusChange: (active: boolean) =>
    track("subscription_status_change", { active }),

  // Payment flows
  paymentMarkPaidSwipe: () => track("payment_mark_paid_swipe"),
  paymentEditDate: () => track("payment_edit_date"),
  paymentDelete: () => track("payment_delete"),
  paymentManageOpen: () => track("payment_manage_open"),
  paymentPayCurrent: () => track("payment_pay_current"),
  paymentAddOnly: () => track("payment_add_only"),

  // Navigation
  homeRefreshPull: () => track("home_refresh_pull"),
  screenAllPaymentsOpen: () => track("screen_all_payments_open"),
  screenSearchOpen: () => track("screen_search_open"),
  screenSettingsOpen: () => track("screen_settings_open"),
  screenAboutOpen: () => track("screen_about_open"),

  // Settings
  settingThemeChange: (theme: string) =>
    track("setting_theme_change", { theme }),
  settingCurrencyChange: (currency: string) =>
    track("setting_currency_change", { currency }),
  settingFontChange: (font: string) => track("setting_font_change", { font }),
  settingHapticsToggle: (enabled: boolean) =>
    track("setting_haptics_toggle", { enabled }),
  settingNotificationDaysChange: (days: number) =>
    track("setting_notification_days_change", { days }),
  settingNotificationTimeChange: () => track("setting_notification_time_change"),

  // Auth
  authSignIn: (provider: string) => track("auth_sign_in", { provider }),
  authSignOut: () => track("auth_sign_out"),
};
