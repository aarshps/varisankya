import Foundation
import FirebaseAnalytics

/// Thin wrapper around FirebaseAnalytics. Mirrors the Android Analytics surface
/// 1:1 so dashboards stay readable across platforms.
///
/// **Invariant:** scalar params only — no subscription names, amounts, or
/// document IDs (Firebase Analytics has a 40-distinct-values cap per text param).
enum AppAnalytics {

    private static func log(_ event: String, _ params: [String: Any] = [:]) {
        // Screenshot mode runs with Firebase un-configured; skip analytics so a
        // logEvent call can never touch an uninitialised SDK during capture.
        if AppEnv.isScreenshotMode { return }
        Analytics.logEvent(event, parameters: params.isEmpty ? nil : params)
    }

    // MARK: Subscription flows
    static func subscriptionAddOpen() { log("subscription_add_open") }
    static func subscriptionEditOpen() { log("subscription_edit_open") }
    static func subscriptionSave(isNew: Bool, recurrence: String) {
        log("subscription_save", ["is_new": isNew, "recurrence": recurrence])
    }
    static func subscriptionDelete() { log("subscription_delete") }
    static func subscriptionStatusChange(active: Bool) {
        log("subscription_status_change", ["active": active])
    }

    // MARK: Payment flows
    static func paymentMarkPaidSwipe() { log("payment_mark_paid_swipe") }
    static func paymentManageOpen() { log("payment_manage_open") }
    static func paymentPayCurrent() { log("payment_pay_current") }
    static func paymentAddOnly() { log("payment_add_only") }
    static func paymentEditDate() { log("payment_edit_date") }
    static func paymentDelete() { log("payment_delete") }
    static func paymentHistoryCleanup(count: Int) {
        log("payment_history_cleanup", ["count": count])
    }

    // MARK: Notifications
    static func notificationWorkerScheduled() { log("notification_worker_scheduled") }
    static func notificationTap() { log("notification_tap") }
    static func notificationTestSent() { log("notification_test_sent") }

    // MARK: Navigation
    static func homeRefreshPull() { log("home_refresh_pull") }
    static func screenAllPaymentsOpen() { log("screen_all_payments_open") }
    static func screenSearchOpen() { log("screen_search_open") }
    static func screenSettingsOpen() { log("screen_settings_open") }
    static func screenAboutOpen() { log("screen_about_open") }

    // MARK: Settings
    static func settingThemeChange(_ theme: String) { log("setting_theme_change", ["theme": theme]) }
    static func settingCurrencyChange(_ currency: String) {
        log("setting_currency_change", ["currency": currency])
    }
    static func settingFontChange(_ font: String) { log("setting_font_change", ["font": font]) }
    static func settingHapticsToggle(_ enabled: Bool) {
        log("setting_haptics_toggle", ["enabled": enabled])
    }
    static func settingAppLockToggle(_ enabled: Bool) {
        log("setting_app_lock_toggle", ["enabled": enabled])
    }
    static func settingNotificationDaysChange(_ days: Int) {
        log("setting_notification_days_change", ["days": days])
    }
    static func settingNotificationTimeChange() { log("setting_notification_time_change") }

    // MARK: Auth
    static func authSignIn(provider: String) { log("auth_sign_in", ["provider": provider]) }
    static func authSignOut() { log("auth_sign_out") }
}
