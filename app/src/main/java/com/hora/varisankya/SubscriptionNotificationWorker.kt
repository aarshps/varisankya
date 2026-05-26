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
import androidx.work.WorkerParameters
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import com.hora.varisankya.receiver.NotificationActionReceiver
import com.hora.varisankya.util.Analytics

class SubscriptionNotificationWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        Log.d(TAG, "Worker started")
        Analytics.init(applicationContext)

        val auth = FirebaseAuth.getInstance()
        val userId = auth.currentUser?.uid
        if (userId == null) {
            Log.d(TAG, "No signed-in user — skipping run")
            Analytics.notificationWorkerRun(
                success = true,
                signedIn = false,
                subscriptionsChecked = 0,
                notificationsPosted = 0,
            )
            return Result.success()
        }

        val firestore = FirebaseFirestore.getInstance()
        try {
            val snapshots = firestore.collection("users")
                .document(userId)
                .collection("subscriptions")
                .whereEqualTo("active", true)
                .get()
                .await()

            val subscriptions = snapshots.toObjects(Subscription::class.java)
            val notificationWindow = PreferenceHelper.getNotificationDays(applicationContext)

            // Both today and dueLocalDate are computed in the SAME zone (UTC) to avoid
            // the off-by-one boundary errors that happen when the device is in IST
            // and dueDate was stored as a UTC-midnight Firestore Timestamp.
            val utcZone = java.time.ZoneId.of("UTC")
            val todayLocalDate = java.time.LocalDate.now(utcZone)

            var posted = 0
            subscriptions.forEach { sub ->
                sub.dueDate?.let { dueDate ->
                    val dueLocalDate = dueDate.toInstant().atZone(utcZone).toLocalDate()
                    val daysLeft = java.time.temporal.ChronoUnit.DAYS
                        .between(todayLocalDate, dueLocalDate).toInt()

                    if (daysLeft in 0..notificationWindow) {
                        if (sendNotification(sub, daysLeft)) posted++
                    }
                }
            }

            Log.d(TAG, "Run complete — checked=${subscriptions.size}, posted=$posted")
            Analytics.notificationWorkerRun(
                success = true,
                signedIn = true,
                subscriptionsChecked = subscriptions.size,
                notificationsPosted = posted,
            )
            return Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching subscriptions", e)
            Analytics.notificationWorkerRun(
                success = false,
                signedIn = true,
                subscriptionsChecked = 0,
                notificationsPosted = 0,
            )
            return Result.retry()
        }
    }

    /** Returns true if a notification was actually posted (permission etc. allowed it). */
    private fun sendNotification(subscription: Subscription, daysLeft: Int): Boolean {
        val context = applicationContext
        if (ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return false
        }

        createNotificationChannel(context)

        val subId = subscription.id ?: return false
        val notifId = notificationIdFor(subId)

        val title = when (daysLeft) {
            0 -> "Due Today"
            1 -> "Due Tomorrow"
            else -> "Due in $daysLeft days"
        }
        val autopayPrefix = if (subscription.autopay) "Autopay • " else ""
        val message = "$autopayPrefix${subscription.name}: ${subscription.currency} ${subscription.cost}"

        val builder = buildNotification(
            context = context,
            channelId = CHANNEL_ID,
            title = title,
            message = message,
            notifId = notifId,
            subscriptionId = subId,
        )

        with(NotificationManagerCompat.from(context)) {
            // notify with the same ID overwrites any prior notification for this subscription
            notify(notifId, builder.build())
        }
        Analytics.notificationPosted(daysLeft = daysLeft)
        return true
    }

    companion object {
        private const val TAG = "NotificationWorker"

        // Bumped from v2 → v3 in v3.8-beta.12 to swap the channel importance
        // from LOW (silent, no peek) up to DEFAULT (sound + peek). Channel
        // importance can only be raised by recreating the channel with a new
        // ID — the OS treats it as immutable once a user-visible channel has
        // been created.
        const val CHANNEL_ID = "subscription_reminders_v3"
        const val GROUP_KEY_SUBSCRIPTIONS = "com.hora.varisankya.SUBSCRIPTIONS"

        /** Stable mapping from a Firestore subscription ID to the OS notification ID. */
        fun notificationIdFor(subscriptionId: String): Int = subscriptionId.hashCode()

        fun cancelFor(context: Context, subscriptionId: String) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.cancel(notificationIdFor(subscriptionId))
        }

        /**
         * User-triggered diagnostic from Settings → Send Test Notification.
         * Bypasses the worker entirely and posts a sample notification right
         * now so the user can verify the channel + permission + visibility on
         * their specific device.
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
            val notifId = "varisankya-test-notification".hashCode()
            val builder = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentTitle("Varisankya — test notification")
                .setContentText("If you can see this, notifications are working.")
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
            NotificationManagerCompat.from(context).notify(notifId, builder.build())
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

        private fun buildNotification(
            context: Context,
            channelId: String,
            title: String,
            message: String,
            notifId: Int,
            subscriptionId: String,
        ): NotificationCompat.Builder {
            // Body tap → MainActivity. EXTRA_FROM_NOTIFICATION lets the
            // activity log notification_tap on resume.
            val openIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                putExtra(MainActivity.EXTRA_FROM_NOTIFICATION, true)
            }
            val openPi = PendingIntent.getActivity(
                context, notifId, openIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )

            // Mark Paid action → broadcast receiver, marks paid + cancels notification.
            val markPaidIntent = Intent(context, NotificationActionReceiver::class.java).apply {
                action = NotificationActionReceiver.ACTION_MARK_PAID
                putExtra(NotificationActionReceiver.EXTRA_SUB_ID, subscriptionId)
                putExtra(NotificationActionReceiver.EXTRA_NOTIF_ID, notifId)
            }
            val markPaidPi = PendingIntent.getBroadcast(
                context, notifId, markPaidIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )

            // Dismiss (swipe-away or "clear all") → broadcast receiver, logs notification_dismiss.
            val dismissIntent = Intent(context, NotificationActionReceiver::class.java).apply {
                action = NotificationActionReceiver.ACTION_NOTIFICATION_DISMISSED
            }
            val dismissPi = PendingIntent.getBroadcast(
                context, notifId, dismissIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )

            return NotificationCompat.Builder(context, channelId)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(openPi)
                .setDeleteIntent(dismissPi)
                .addAction(R.drawable.ic_check, "Mark Paid", markPaidPi)
                .setAutoCancel(true)
                .setGroup(GROUP_KEY_SUBSCRIPTIONS)
        }
    }
}
