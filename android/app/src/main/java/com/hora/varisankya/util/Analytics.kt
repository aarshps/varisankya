package com.hora.varisankya.util

import android.content.Context
import android.os.Bundle
import com.google.firebase.analytics.FirebaseAnalytics

/**
 * Thin wrapper around [FirebaseAnalytics] for instrumenting product flows.
 *
 * Goal: be able to audit (in the Firebase Analytics console) which flows users
 * actually exercise so we can deprecate the ones nobody touches. Add a method
 * here for every distinct user-visible action — keep the event name set small
 * and stable so the dashboard stays readable.
 *
 * **Naming convention.** Event names are snake_case (Firebase requirement) and
 * grouped by surface (`subscription_*`, `payment_*`, `screen_*`, `setting_*`,
 * `auth_*`, `notification_*`). Parameters are scalars only; high-cardinality
 * values (PII, IDs, free-form text) MUST NOT be logged.
 *
 * Initialize once from [VarisankyaApplication.onCreate] with [init]; every
 * `logXyz()` call below is a no-op until init has run.
 */
object Analytics {

    private var fa: FirebaseAnalytics? = null

    fun init(context: Context) {
        if (fa == null) {
            fa = FirebaseAnalytics.getInstance(context.applicationContext)
        }
    }

    private fun log(event: String, vararg params: Pair<String, Any?>) {
        val instance = fa ?: return
        if (params.isEmpty()) {
            instance.logEvent(event, null)
            return
        }
        val bundle = Bundle()
        for ((key, value) in params) {
            when (value) {
                null -> {}
                is String -> bundle.putString(key, value)
                is Int -> bundle.putInt(key, value)
                is Long -> bundle.putLong(key, value)
                is Double -> bundle.putDouble(key, value)
                is Float -> bundle.putFloat(key, value)
                is Boolean -> bundle.putBoolean(key, value)
                else -> bundle.putString(key, value.toString())
            }
        }
        instance.logEvent(event, bundle)
    }

    // -- Subscription flows ---------------------------------------------------
    fun subscriptionAddOpen() = log("subscription_add_open")
    fun subscriptionEditOpen() = log("subscription_edit_open")
    fun subscriptionSave(isNew: Boolean, recurrence: String) =
        log("subscription_save", "is_new" to isNew, "recurrence" to recurrence)
    fun subscriptionDelete() = log("subscription_delete")
    fun subscriptionStatusChange(active: Boolean) =
        log("subscription_status_change", "active" to active)

    // -- Payment flows --------------------------------------------------------
    fun paymentMarkPaidSwipe() = log("payment_mark_paid_swipe")
    fun paymentManageOpen() = log("payment_manage_open")
    fun paymentPayCurrent() = log("payment_pay_current")
    fun paymentAddOnly() = log("payment_add_only")
    fun paymentEditDate() = log("payment_edit_date")
    fun paymentDelete() = log("payment_delete")
    fun paymentHistoryCleanup(count: Int) =
        log("payment_history_cleanup", "count" to count)

    // -- Notification lifecycle + actions -------------------------------------
    /**
     * Fired once each time MainActivity (re-)schedules the periodic worker.
     * Lets us see whether the scheduling code path is even running per user.
     */
    fun notificationWorkerScheduled() = log("notification_worker_scheduled")

    /**
     * Fired at the end of every [SubscriptionNotificationWorker.doWork] run.
     * The success / signed_in / counts params answer "did the worker actually
     * run, and did it find anything?"
     */
    fun notificationWorkerRun(
        success: Boolean,
        signedIn: Boolean,
        subscriptionsChecked: Int,
        notificationsPosted: Int,
    ) = log(
        "notification_worker_run",
        "success" to success,
        "signed_in" to signedIn,
        "subscriptions_checked" to subscriptionsChecked,
        "notifications_posted" to notificationsPosted,
    )

    /**
     * Fired when the worker posts the consolidated reminder notification (the
     * app shows at most one notification at a time). `days_left` is the most
     * urgent item folded in; `due_count` is how many items it covers. The
     * count of this event over a window is the *denominator* against which
     * [notificationTap] becomes a meaningful tap-through rate.
     */
    fun notificationPosted(daysLeft: Int, dueCount: Int) =
        log("notification_posted", "days_left" to daysLeft, "due_count" to dueCount)

    /** User tapped the body of the notification, opening the app. */
    fun notificationTap() = log("notification_tap")

    /** User tapped "Send Test Notification" in Settings to verify the chain. */
    fun notificationTestSent() = log("notification_test_sent")

    // -- General usage --------------------------------------------------------
    /** User performed pull-to-refresh on the home subscription list. */
    fun homeRefreshPull() = log("home_refresh_pull")

    // -- Screens / navigation -------------------------------------------------
    fun screenAllPaymentsOpen() = log("screen_all_payments_open")
    fun screenSearchOpen() = log("screen_search_open")
    fun screenSettingsOpen() = log("screen_settings_open")
    fun screenAboutOpen() = log("screen_about_open")

    // -- Settings interactions ------------------------------------------------
    fun settingThemeChange(theme: String) = log("setting_theme_change", "theme" to theme)
    fun settingCurrencyChange(currency: String) = log("setting_currency_change", "currency" to currency)
    fun settingFontChange(font: String) = log("setting_font_change", "font" to font)
    fun settingHapticsToggle(enabled: Boolean) = log("setting_haptics_toggle", "enabled" to enabled)
    fun settingAppLockToggle(enabled: Boolean) = log("setting_app_lock_toggle", "enabled" to enabled)
    fun settingNotificationDaysChange(days: Int) =
        log("setting_notification_days_change", "days" to days)
    fun settingNotificationTimeChange() = log("setting_notification_time_change")

    // -- Auth -----------------------------------------------------------------
    fun authSignIn(provider: String = "google") = log("auth_sign_in", "provider" to provider)
    fun authSignOut() = log("auth_sign_out")
}
