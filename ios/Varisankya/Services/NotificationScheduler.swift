import Foundation
import UserNotifications

/// Schedules consolidated due-date reminders using UNUserNotificationCenter.
///
/// **Why scheduled-local, not silent-push:** The Android app uses WorkManager
/// to run a daily worker that queries Firestore and posts a notification. iOS
/// background processing is much more restricted — we cannot reliably wake on
/// a schedule to make a network call. So instead, every time the app is
/// foregrounded (or a sub is added/edited/paid), we **re-schedule** reminders
/// locally.
///
/// **One consolidated notification, nothing left out:** for every day in the
/// next [horizonDays] on which at least one subscription sits inside the
/// user's notification window, ONE notification is scheduled whose content
/// covers EVERY such subscription for that day — never one notification per
/// subscription, and never just the soonest item. Identifiers are per-day
/// (`reminder.<yyyyMMdd>`) so each day can have its own pending request; all
/// share one `threadIdentifier`, so in the rare case the app is not opened
/// across several due days, iOS collapses the deliveries into a single
/// visual group rather than a pile of separate items. Every reschedule
/// clears all pending AND delivered notifications first, so the tray is
/// rebuilt fresh from current data each time the app runs.
enum NotificationScheduler {

    /// Per-day reminder identifiers share this prefix; the suffix is the
    /// fire day as `yyyyMMdd`.
    static let reminderIdentifierPrefix = "com.hora.varisankya.reminder."

    /// How many days ahead reminders are scheduled on each pass. One pending
    /// request per due day keeps us far under iOS's 64-pending cap (the old
    /// per-subscription-per-day scheme could blow past it). Any app launch
    /// inside the horizon extends it again.
    private static let horizonDays = 30

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

    /// Re-schedules the consolidated reminders: one notification per upcoming
    /// day (inside [horizonDays]) that has at least one subscription within
    /// its notification window, each covering everything relevant that day.
    static func rescheduleAll(for subscriptions: [Subscription]) async {
        let prefs = Preferences.shared
        let hour = prefs.notificationHour
        let minute = prefs.notificationMinute
        let window = prefs.notificationDays

        clearAll()

        let center = UNUserNotificationCenter.current()
        let cal = Calendar(identifier: .gregorian)
        let now = Date()
        let todayStart = cal.startOfDay(for: now)
        let active = subscriptions.filter { $0.active && $0.dueDate != nil }

        guard !active.isEmpty else {
            AppAnalytics.notificationWorkerScheduled()
            return
        }

        for offset in 0..<horizonDays {
            guard let day = cal.date(byAdding: .day, value: offset, to: todayStart),
                  let fire = fireDate(forDay: day, hour: hour, minute: minute, after: now)
            else { continue }

            // Everything inside its window on this day, most urgent first.
            let dueItems: [(sub: Subscription, daysLeft: Int)] = active.compactMap { sub in
                guard let due = sub.dueDate else { return nil }
                let days = cal.dateComponents([.day], from: day, to: cal.startOfDay(for: due)).day ?? -1
                return (0...window).contains(days) ? (sub, days) : nil
            }.sorted { $0.daysLeft < $1.daysLeft }

            guard !dueItems.isEmpty else { continue }

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
                identifier: reminderIdentifierPrefix + dayKey(for: day),
                content: content,
                trigger: trigger
            )
            try? await center.add(request)
        }
        AppAnalytics.notificationWorkerScheduled()
    }

    /// User-facing diagnostic — posts a test notification right now. Clears
    /// delivered notifications first so testing never stacks a second item.
    static func postTestNotification() async {
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
        let content = UNMutableNotificationContent()
        content.title = "Varisankya \u{2014} test notification"
        content.body = "If you can see this, notifications are working."
        content.sound = .default
        content.threadIdentifier = "subscriptions"
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: reminderIdentifierPrefix + "test",
            content: content,
            trigger: trigger
        )
        try? await UNUserNotificationCenter.current().add(request)
        AppAnalytics.notificationTestSent()
    }

    // MARK: - Helpers

    private static func dayKey(for day: Date) -> String {
        let comps = Calendar(identifier: .gregorian).dateComponents([.year, .month, .day], from: day)
        return String(format: "%04d%02d%02d", comps.year ?? 0, comps.month ?? 0, comps.day ?? 0)
    }

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
