package com.hora.varisankya

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.google.android.material.color.MaterialColors
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.concurrent.TimeUnit
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import com.hora.varisankya.util.Analytics

class SubscriptionNotificationWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    private data class DueItem(val subscription: Subscription, val daysLeft: Int)

    override suspend fun doWork(): Result {
        // Refresh runs are enqueued by in-app data changes (payment, delete,
        // deactivate) and only update/clear the already-visible summary —
        // silently, without touching the daily chain or its analytics.
        val isRefresh = inputData.getBoolean(KEY_IS_REFRESH, false)
        Log.d(TAG, "Worker started (refresh=$isRefresh)")
        Analytics.init(applicationContext)

        var success = false
        var signedIn = false
        var checked = 0
        var posted = false

        try {
            val userId = FirebaseAuth.getInstance().currentUser?.uid
            if (userId == null) {
                Log.d(TAG, "No signed-in user — skipping run")
            } else {
                signedIn = true
                val firestore = FirebaseFirestore.getInstance()
                val snapshots = firestore.collection("users")
                    .document(userId)
                    .collection("subscriptions")
                    .whereEqualTo("active", true)
                    .get()
                    .await()

                val subscriptions = snapshots.toObjects(Subscription::class.java)
                checked = subscriptions.size
                val notificationWindow = PreferenceHelper.getNotificationDays(applicationContext)

                val todayUtc = java.time.LocalDate.now(java.time.ZoneId.of("UTC"))

                val dueItems = subscriptions.mapNotNull { sub ->
                    sub.dueDate?.let { dueDate ->
                        val daysLeft = daysLeftUtc(dueDate, todayUtc)
                        if (daysLeft in 0..notificationWindow) DueItem(sub, daysLeft) else null
                    }
                }.sortedBy { it.daysLeft }

                posted = postSummaryNotification(dueItems, refresh = isRefresh)
                Log.d(TAG, "Run complete — checked=$checked, due=${dueItems.size}, posted=$posted")
            }
            success = true
        } catch (e: Exception) {
            // Transient failure (network, Firestore, etc.) — log it, don't retry.
            // Missing a single daily run is acceptable; the chained next run
            // will try again at the same time tomorrow.
            Log.e(TAG, "Error in worker — failing this run, will retry tomorrow", e)
        }

        if (!isRefresh) {
            Analytics.notificationWorkerRun(
                success = success,
                signedIn = signedIn,
                subscriptionsChecked = checked,
                notificationsPosted = if (posted) 1 else 0,
            )

            // CHAINED ONE-SHOT: schedule the next run from CURRENT local time so
            // the app self-corrects after timezone travel / DST. Without this the
            // worker would drift away from the user's wall-clock target hour.
            scheduleNext(applicationContext, replacing = true)
        }

        return Result.success()
    }

    /**
     * Posts (or clears) the app's single consolidated reminder notification.
     *
     * The app shows AT MOST ONE notification at any time, and that one
     * notification covers EVERYTHING due inside the window — nothing is
     * dropped to satisfy the one-notification rule. It is posted under
     * [SUMMARY_NOTIFICATION_ID]; re-posting with the same ID replaces the
     * previous version, and an empty due list clears it so the drawer never
     * shows stale reminders.
     *
     * Daily runs (`refresh = false`) alert like any reminder. Refresh runs
     * (`refresh = true`) keep the visible summary truthful after an in-app
     * change: they update it in place silently (e.g. drop the just-paid item,
     * keep the rest), and never resurrect a summary the user has dismissed.
     *
     * Returns true if a notification was actually posted.
     */
    private fun postSummaryNotification(dueItems: List<DueItem>, refresh: Boolean): Boolean {
        val context = applicationContext

        if (dueItems.isEmpty()) {
            cancelSummary(context)
            return false
        }

        if (ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return false
        }

        if (refresh && !isSummaryDisplayed(context)) {
            // The user dismissed (or never had) the summary — a data change
            // must not re-alert them. The next daily run re-posts as usual.
            return false
        }

        createNotificationChannel(context)

        val builder = if (dueItems.size == 1) {
            val item = dueItems.first()
            baseBuilder(context)
                .setContentTitle(titleFor(item.daysLeft))
                .setContentText(lineFor(item, withDayPrefix = false))
        } else {
            val style = NotificationCompat.InboxStyle()
            dueItems.forEach { style.addLine(lineFor(it, withDayPrefix = true)) }
            baseBuilder(context)
                .setContentTitle("${dueItems.size} payments due soon")
                .setContentText(dueItems.joinToString(", ") { it.subscription.name })
                .setStyle(style)
        }

        // setOnlyAlertOnce: an in-place refresh of a displayed notification
        // must not buzz again — only genuinely new daily reminders alert.
        if (refresh) builder.setOnlyAlertOnce(true)

        NotificationManagerCompat.from(context).notify(SUMMARY_NOTIFICATION_ID, builder.build())
        if (!refresh) {
            Analytics.notificationPosted(
                daysLeft = dueItems.first().daysLeft,
                dueCount = dueItems.size,
            )
        }
        return true
    }

    private fun isSummaryDisplayed(context: Context): Boolean {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        return nm.activeNotifications.any { it.id == SUMMARY_NOTIFICATION_ID }
    }

    private fun titleFor(daysLeft: Int): String = when (daysLeft) {
        0 -> "Due Today"
        1 -> "Due Tomorrow"
        else -> "Due in $daysLeft days"
    }

    private fun lineFor(item: DueItem, withDayPrefix: Boolean): String {
        val sub = item.subscription
        val dayPrefix = if (withDayPrefix) {
            when (item.daysLeft) {
                0 -> "Today • "
                1 -> "Tomorrow • "
                else -> "In ${item.daysLeft} days • "
            }
        } else ""
        val autopayPrefix = if (sub.autopay) "Autopay • " else ""
        return "$dayPrefix$autopayPrefix${sub.name}: ${sub.currency} ${sub.cost}"
    }

    /**
     * Hora family Notification Design Standard (Material 3 bleeding): full-bleed
     * background via [NotificationCompat.Builder.setColorized] driven by the
     * app's Material You primary colour, subtext metadata (app name + time),
     * PRIORITY_HIGH, and vibration gated on the user's haptics preference.
     * See hora-core/docs/conventions.md → "Notification Design Standard".
     */
    private fun baseBuilder(context: Context): NotificationCompat.Builder {
        // Body tap → MainActivity. EXTRA_FROM_NOTIFICATION lets the
        // activity log notification_tap on resume.
        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra(MainActivity.EXTRA_FROM_NOTIFICATION, true)
        }
        val openPi = PendingIntent.getActivity(
            context, SUMMARY_NOTIFICATION_ID, openIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )

        val primaryColor = MaterialColors.getColor(
            context, android.R.attr.colorPrimary, 0xFF1C1B1F.toInt()
        )
        val formattedTime = SimpleDateFormat("h:mm a", Locale.getDefault()).format(java.util.Date())

        return NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setSubText("Varisankya • $formattedTime")
            .setColor(primaryColor)
            .setColorized(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(openPi)
            .setAutoCancel(true)
            .setVibrate(
                if (PreferenceHelper.isHapticsEnabled(context)) longArrayOf(0, 200) else longArrayOf(0)
            )
    }

    companion object {
        private const val TAG = "NotificationWorker"

        // Bumped from v2 → v3 in v3.8-beta.12 to swap the channel importance
        // from LOW (silent, no peek) up to DEFAULT (sound + peek). Bumped
        // v3 → v4 in v3.9-beta.27 to reach HIGH (Hora Notifications Design
        // Standard — full-bleed + heads-up). Channel importance can only be
        // raised by recreating the channel with a new ID — the OS treats it
        // as immutable once a user-visible channel has been created.
        const val CHANNEL_ID = "subscription_reminders_v4"

        // The one and only notification ID this app ever posts. Reminders and
        // the Settings test notification all share it, which is what enforces
        // the "at most one Varisankya notification at a time" invariant.
        const val SUMMARY_NOTIFICATION_ID = 1

        // Unique-work name for the chained one-shot reminder worker. All call
        // sites that schedule the worker (cold-start, settings change, system
        // timezone broadcast, worker self-chain) share this name so they
        // co-operate via ExistingWorkPolicy.
        const val WORK_NAME = "subscription_notifications"

        // Separate unique-work name for in-app silent refreshes. MUST stay
        // distinct from [WORK_NAME]: REPLACE-ing the daily chain would cancel
        // the scheduled next-day reminder.
        const val REFRESH_WORK_NAME = "subscription_notifications_refresh"

        const val KEY_IS_REFRESH = "is_refresh"

        /**
         * Whole days from [todayUtc] to [dueDate], both interpreted in UTC.
         *
         * Both sides MUST stay in UTC: dueDate is stored as a UTC-midnight
         * Firestore Timestamp (the MaterialDatePicker writes that), and
         * mixing in the device-local zone here silently skips boundary days
         * for users in non-UTC zones like IST (the v3.8-beta.12 regression).
         * 0 = due today, 1 = tomorrow, negative = overdue.
         */
        fun daysLeftUtc(dueDate: java.util.Date, todayUtc: java.time.LocalDate): Int {
            val dueLocalDate = dueDate.toInstant()
                .atZone(java.time.ZoneId.of("UTC"))
                .toLocalDate()
            return java.time.temporal.ChronoUnit.DAYS
                .between(todayUtc, dueLocalDate).toInt()
        }

        /**
         * Clears the consolidated reminder notification outright. Used when
         * the reminder schedule itself changes (Settings); for data changes
         * (payment/delete) prefer [refreshNow], which keeps the summary alive
         * for whatever is still due instead of hiding everything.
         */
        fun cancelSummary(context: Context) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.cancel(SUMMARY_NOTIFICATION_ID)
        }

        /**
         * Re-evaluates the summary right now after an in-app data change
         * (payment recorded, subscription deleted/deactivated). Runs the
         * worker once in refresh mode: the visible summary is updated in
         * place — minus the handled item, keeping every other due item — or
         * cleared when nothing remains due. Silent (no re-alert), never
         * resurrects a dismissed summary, and leaves the daily chain alone.
         */
        fun refreshNow(context: Context) {
            val request = OneTimeWorkRequestBuilder<SubscriptionNotificationWorker>()
                .setInputData(workDataOf(KEY_IS_REFRESH to true))
                .build()
            WorkManager.getInstance(context)
                .enqueueUniqueWork(REFRESH_WORK_NAME, ExistingWorkPolicy.REPLACE, request)
        }

        /**
         * Schedule the next reminder worker run for the next occurrence of the
         * user's chosen hour:minute **in device-local time**. Called from:
         *
         *  - [MainActivity.setupNotifications] on cold start (replacing=false,
         *    KEEP policy — if a worker is already enqueued for tomorrow,
         *    cold start should not disturb it).
         *  - [SettingsActivity.rescheduleNotifications] when the user picks a
         *    new reminder time (replacing=true, REPLACE policy — the user
         *    explicitly changed the schedule).
         *  - The worker itself at the end of [doWork] (replacing=true) —
         *    chains the next day's run from the *current* local time so the
         *    schedule self-corrects after timezone travel or DST.
         *  - [com.hora.varisankya.receiver.SystemEventReceiver] when the
         *    system fires `ACTION_TIMEZONE_CHANGED` or `ACTION_TIME_SET`
         *    (replacing=true).
         *
         * Computing the delay in Calendar fields (HOUR_OF_DAY / MINUTE) means
         * we always anchor to the user's current wall-clock zone — there is
         * no absolute UTC instant baked in.
         */
        fun scheduleNext(context: Context, replacing: Boolean) {
            val hour = PreferenceHelper.getNotificationHour(context)
            val minute = PreferenceHelper.getNotificationMinute(context)

            val now = Calendar.getInstance()
            val target = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            if (!target.after(now)) target.add(Calendar.DAY_OF_YEAR, 1)
            val delayMs = target.timeInMillis - now.timeInMillis

            val request = OneTimeWorkRequestBuilder<SubscriptionNotificationWorker>()
                .setInitialDelay(delayMs, TimeUnit.MILLISECONDS)
                .build()
            val policy = if (replacing) ExistingWorkPolicy.REPLACE else ExistingWorkPolicy.KEEP
            WorkManager.getInstance(context).enqueueUniqueWork(WORK_NAME, policy, request)

            Analytics.init(context)
            Analytics.notificationWorkerScheduled()
        }

        /**
         * User-triggered diagnostic from Settings → Send Test Notification.
         * Bypasses the worker entirely and posts a sample notification right
         * now so the user can verify the channel + permission + visibility on
         * their specific device. Posts under [SUMMARY_NOTIFICATION_ID] so the
         * max-one-notification invariant holds even while testing; the next
         * worker run replaces it with the real summary.
         */
        fun postTestNotification(context: Context) {
            if (ActivityCompat.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                return
            }
            createNotificationChannel(context)
            val primaryColor = MaterialColors.getColor(
                context, android.R.attr.colorPrimary, 0xFF1C1B1F.toInt()
            )
            val builder = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle("Varisankya — test notification")
                .setContentText("If you can see this, notifications are working.")
                .setColor(primaryColor)
                .setColorized(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setVibrate(
                    if (PreferenceHelper.isHapticsEnabled(context)) longArrayOf(0, 200) else longArrayOf(0)
                )
            NotificationManagerCompat.from(context).notify(SUMMARY_NOTIFICATION_ID, builder.build())
            Analytics.init(context)
            Analytics.notificationTestSent()
        }

        private fun createNotificationChannel(context: Context) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Garbage-collect any legacy channels so the drawer settings UI
            // only shows the current one.
            nm.deleteNotificationChannel("subscription_reminders")
            nm.deleteNotificationChannel("subscription_reminders_v1")
            nm.deleteNotificationChannel("subscription_reminders_v2")
            nm.deleteNotificationChannel("subscription_reminders_v3")

            val channel = NotificationChannel(
                CHANNEL_ID,
                "Subscription Reminders",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = "Daily reminders for upcoming subscription payments"
                enableLights(false)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 200)
                setShowBadge(true)
            }
            nm.createNotificationChannel(channel)
        }
    }
}
