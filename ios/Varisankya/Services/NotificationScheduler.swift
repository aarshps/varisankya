import Foundation
import UserNotifications

/// Schedules the app's single consolidated due-date reminder using
/// UNUserNotificationCenter.
///
/// **Why scheduled-local, not silent-push:** The Android app uses WorkManager
/// to run a daily worker that queries Firestore and posts a notification. iOS
/// background processing is much more restricted — we cannot reliably wake on
/// a schedule to make a network call. So instead, every time the app is
/// foregrounded (or a sub is added/edited/paid), we **re-schedule** the next
/// reminder locally.
///
/// **At most one notification at a time:** everything due inside the user's
/// notification window is folded into ONE notification, and every request is
/// posted under the same fixed identifier ([reminderIdentifier]). Same
/// identifier means iOS replaces the previous notification — pending or
/// delivered — instead of stacking a second one, which is what enforces the
/// "max one Varisankya notification" invariant. The deliberate trade-off:
/// only the *next* reminder is ever scheduled, so if the app is not opened
/// after it fires, no further reminders arrive until the next launch
/// reschedules. Accurate-and-single beats stale-and-stacked.
enum NotificationScheduler {

    /// The one and only notification identifier this app ever uses. Reminders
    /// and the Settings test notification all share it.
    static let reminderIdentifier = "com.hora.varisankya.reminder"

    /// Requests permission. Returns true if granted (or previously authorised).
    @discardableResult
    static func requestAuthorization() async -> Bool {
        let center = UNUserNotificationCenter.current()
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            return granted
        } catch {
            return false
        }
    }

    /// Clears every scheduled and delivered notification. Call before
    /// rescheduling, and after payments/deletes so the tray never shows a
    /// stale reminder.
    static func clearAll() {
        let center = UNUserNotificationCenter.current()
        center.removeAllPendingNotificationRequests()
        center.removeAllDeliveredNotifications()
    }

    /// Re-schedules the single consolidated reminder: finds the earliest
    /// upcoming fire time (the user's chosen hour:minute on the first day on
    /// which at least one active subscription is inside its notification
    /// window) and bundles everything due-relevant on that day into one
    /// notification.
    static func rescheduleAll(for subscriptions: [Subscription]) async {
        let prefs = Preferences.shared
        let hour = prefs.notificationHour
        let minute = prefs.notificationMinute
        let window = prefs.notificationDays

        clearAll()

        let cal = Calendar(identifier: .gregorian)
        let now = Date()
        let active = subscriptions.filter { $0.active && $0.dueDate != nil }

        // Earliest fire date = min over all (sub, daysBefore) candidates.
        var earliestFire: Date?
        for sub in active {
            guard let due = sub.dueDate else { continue }
            for daysBefore in 0...window {
                guard let triggerDay = cal.date(byAdding: .day, value: -daysBefore, to: due),
                      let fire = fireDate(forDay: triggerDay, hour: hour, minute: minute, after: now)
                else { continue }
                if earliestFire == nil || fire < earliestFire! {
                    earliestFire = fire
                }
            }
        }

        guard let fire = earliestFire else {
            AppAnalytics.notificationWorkerScheduled()
            return
        }

        // Everything inside its window on the fire day, most urgent first.
        let fireDay = cal.startOfDay(for: fire)
        let dueItems: [(sub: Subscription, daysLeft: Int)] = active.compactMap { sub in
            guard let due = sub.dueDate else { return nil }
            let days = cal.dateComponents([.day], from: fireDay, to: cal.startOfDay(for: due)).day ?? -1
            return (0...window).contains(days) ? (sub, days) : nil
        }.sorted { $0.daysLeft < $1.daysLeft }

        guard !dueItems.isEmpty else {
            AppAnalytics.notificationWorkerScheduled()
            return
        }

        let content = UNMutableNotificationContent()
        if dueItems.count == 1 {
            let item = dueItems[0]
            content.title = title(forDaysLeft: item.daysLeft)
            content.body = line(for: item.sub, daysLeft: item.daysLeft, withDayPrefix: false)
        } else {
            content.title = "\(dueItems.count) payments due soon"
            content.body = dueItems
                .map { line(for: $0.sub, daysLeft: $0.daysLeft, withDayPrefix: true) }
                .joined(separator: "\n")
        }
        content.sound = .default
        content.threadIdentifier = "subscriptions"

        let comps = cal.dateComponents([.year, .month, .day, .hour, .minute], from: fire)
        let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
        let request = UNNotificationRequest(
            identifier: reminderIdentifier,
            content: content,
            trigger: trigger
        )
        try? await UNUserNotificationCenter.current().add(request)
        AppAnalytics.notificationWorkerScheduled()
    }

    /// User-facing diagnostic — posts a test notification right now. Uses the
    /// same fixed identifier as the real reminder so the max-one-notification
    /// invariant holds even while testing; the next reschedule replaces it.
    static func postTestNotification() async {
        let content = UNMutableNotificationContent()
        content.title = "Varisankya \u{2014} test notification"
        content.body = "If you can see this, notifications are working."
        content.sound = .default
        content.threadIdentifier = "subscriptions"
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: reminderIdentifier,
            content: content,
            trigger: trigger
        )
        try? await UNUserNotificationCenter.current().add(request)
        AppAnalytics.notificationTestSent()
    }

    // MARK: - Helpers

    private static func title(forDaysLeft days: Int) -> String {
        switch days {
        case 0: return "Due Today"
        case 1: return "Due Tomorrow"
        default: return "Due in \(days) days"
        }
    }

    private static func line(for sub: Subscription, daysLeft: Int, withDayPrefix: Bool) -> String {
        var prefix = ""
        if withDayPrefix {
            switch daysLeft {
            case 0: prefix = "Today \u{2022} "
            case 1: prefix = "Tomorrow \u{2022} "
            default: prefix = "In \(daysLeft) days \u{2022} "
            }
        }
        if sub.autopay { prefix += "Autopay \u{2022} " }
        return "\(prefix)\(sub.name): \(sub.currency) \(formatAmount(sub.cost))"
    }

    private static func fireDate(forDay day: Date, hour: Int, minute: Int, after: Date) -> Date? {
        let cal = Calendar(identifier: .gregorian)
        var comps = cal.dateComponents([.year, .month, .day], from: day)
        comps.hour = hour
        comps.minute = minute
        guard let candidate = cal.date(from: comps) else { return nil }
        return candidate > after ? candidate : nil
    }

    private static func formatAmount(_ amount: Double) -> String {
        amount.truncatingRemainder(dividingBy: 1) == 0
            ? String(format: "%.0f", amount)
            : String(format: "%.2f", amount)
    }
}
