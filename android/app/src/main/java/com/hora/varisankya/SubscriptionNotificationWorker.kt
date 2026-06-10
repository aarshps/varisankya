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
import java.util.Calendar
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
        Log.d(TAG, "Worker started")
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

                // Both sides of the days-left calculation are computed in UTC.
                // dueDate is stored as a UTC-midnight Firestore Timestamp (the
                // MaterialDatePicker writes that). Using LocalDate.now() in
                // device-local zone here would silently skip boundary days for
                // users in non-UTC zones like IST.
                val utcZone = java.time.ZoneId.of("UTC")
                val todayLocalDate = java.time.LocalDate.now(utcZone)

                val dueItems = subscriptions.mapNotNull { sub ->
                    sub.dueDate?.let { dueDate ->
                        val dueLocalDate = dueDate.toInstant().atZone(utcZone).toLocalDate()
                        val daysLeft = java.time.temporal.ChronoUnit.DAYS
                            .between(todayLocalDate, dueLocalDate).toInt()
                        if (daysLeft in 0..notificationWindow) DueItem(sub, daysLeft) else null
                    }
                }.sortedBy { it.daysLeft }

                posted = postSummaryNotification(dueItems)
                Log.d(TAG, "Run complete — checked=$checked, due=${dueItems.size}, posted=$posted")
            }
            success = true
        } catch (e: Exception) {
            // Transient failure (network, Firestore, etc.) — log it, don't retry.
            // Missing a single daily run is acceptable; the chained next run
            // will try again at the same time tomorrow.
            Log.e(TAG, "Error in worker — failing this run, will retry tomorrow", e)
        }

        Analytics.notificationWorkerRun(
            success = success,
            signedIn = signedIn,
            subscriptionsChecked = checked,
            notificationsPosted = if (posted) 1 else 0,
        )

        // CHAINED ONE-SHOT: schedule the next run from CURRENT local time so the
        // app self-corrects after timezone travel / DST. Without this the worker
        // would drift away from the user's wall-clock target hour.
        scheduleNext(applicationContext, replacing = true)

        return Result.success()
    }

    /**
     * Posts (or clears) the app's single consolidated reminder notification.
     *
     * The app shows AT MOST ONE notification at any time: everything due inside
     * the window is folded into one summary posted under [SUMMARY_NOTIFICATION_ID].
     * Re-posting with the same ID replaces the previous day's notification, and
     * an empty due list clears it so the drawer never shows stale reminders.
     *
     * Returns true if a notification was actually posted.
     */
    private fun postSummaryNotification(dueItems: List<DueItem>): Boolean {
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

        NotificationManagerCompat.from(context).notify(SUMMARY_NOTIFICATION_ID, builder.build())
        Analytics.notificationPosted(
            daysLeft = dueItems.first().daysLeft,
            dueCount = dueItems.size,
        )
        return true
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

        return NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(openPi)
            .setAutoCancel(true)
    }

    companion object {
        private const val TAG = "NotificationWorker"

        // Bumped from v2 → v3 in v3.8-beta.12 to swap the channel importance
        // from LOW (silent, no peek) up to DEFAULT (sound + peek). Channel
        // importance can only be raised by recreating the channel with a new
        // ID — the OS treats it as immutable once a user-visible channel has
        // been created.
        const val CHANNEL_ID = "subscription_reminders_v3"

        // The one and only notification ID this app ever posts. Reminders and
        // the Settings test notification all share it, which is what enforces
        // the "at most one Varisankya notification at a time" invariant.
        const val SUMMARY_NOTIFICATION_ID = 1

        // Unique-work name for the chained one-shot reminder worker. All call
        // sites that schedule the worker (cold-start, settings change, system
        // timezone broadcast, worker self-chain) share this name so they
        // co-operate via ExistingWorkPolicy.
        const val WORK_NAME = "subscription_notifications"

        /**
         * Clears the consolidated reminder notification. Called after the user
         * records a payment so the drawer matches in-app state; the next daily
         * worker run re-evaluates and re-posts if anything is still due.
         */
        fun cancelSummary(context: Context) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.cancel(SUMMARY_NOTIFICATION_ID)
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
            val builder = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle("Varisankya — test notification")
                .setContentText("If you can see this, notifications are working.")
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
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

            val channel = NotificationChannel(
                CHANNEL_ID,
                "Subscription Reminders",
                NotificationManager.IMPORTANCE_DEFAULT,
            ).apply {
                description = "Daily reminders for upcoming subscription payments"
                enableLights(false)
                enableVibration(true)
                setShowBadge(true)
            }
            nm.createNotificationChannel(channel)
        }
    }
}
