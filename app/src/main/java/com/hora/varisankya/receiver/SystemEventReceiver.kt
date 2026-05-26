package com.hora.varisankya.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.hora.varisankya.SubscriptionNotificationWorker

/**
 * Re-anchors the chained reminder worker to the user's current wall-clock
 * time whenever the system timezone or the system clock itself changes.
 *
 * Without this receiver, the chained worker would still self-correct after
 * its next run (because [SubscriptionNotificationWorker.doWork] re-schedules
 * from the local hour:minute on every fire) — but the user could see one
 * delayed / mistimed notification at the moment of travel. With this
 * receiver, the schedule is corrected the instant the OS reports the change.
 *
 * Wired via `<intent-filter>` in `AndroidManifest.xml`. Both intents are
 * protected broadcasts that only the system can send, so `exported="true"`
 * here is the standard pattern (the system process is the only legitimate
 * sender).
 */
class SystemEventReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_TIMEZONE_CHANGED, Intent.ACTION_TIME_CHANGED -> {
                SubscriptionNotificationWorker.scheduleNext(context, replacing = true)
            }
        }
    }
}
