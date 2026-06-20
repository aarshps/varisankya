import Foundation

/// Deterministic sample content for screenshot mode only (see `AppEnv`). Never
/// referenced on a real user's path — the view models only read this when
/// `AppEnv.isScreenshotMode` is true.
enum SampleData {
    private static let day = 86_400.0
    private static func due(_ n: Double) -> Date { Date().addingTimeInterval(day * n) }

    static var subscriptions: [Subscription] {
        [
            Subscription(id: "s1", name: "Netflix", dueDate: due(0), cost: 649,
                         currency: "INR", recurrence: "Monthly",
                         active: true, autopay: true),
            Subscription(id: "s2", name: "Spotify", dueDate: due(1), cost: 119,
                         currency: "INR", recurrence: "Monthly",
                         active: true, autopay: true),
            Subscription(id: "s3", name: "iCloud+", dueDate: due(3), cost: 75,
                         currency: "INR", recurrence: "Monthly",
                         active: true, autopay: true),
            Subscription(id: "s4", name: "YouTube Premium", dueDate: due(6), cost: 149,
                         currency: "INR", recurrence: "Monthly",
                         active: true, autopay: true),
            Subscription(id: "s5", name: "Cult.fit", dueDate: due(-2), cost: 1300,
                         currency: "INR", recurrence: "Monthly",
                         active: true, autopay: false),
            Subscription(id: "s6", name: "Amazon Prime", dueDate: due(12), cost: 1499,
                         currency: "INR", recurrence: "Yearly",
                         active: true, autopay: false),
            Subscription(id: "s7", name: "Disney+ Hotstar", dueDate: due(20), cost: 1499,
                         currency: "INR", recurrence: "Yearly",
                         active: true, autopay: false),
        ]
    }

    static var payments: [PaymentRecord] {
        [
            PaymentRecord(id: "p1", date: due(-1), amount: 649, subscriptionName: "Netflix",
                          subscriptionId: "s1", currency: "INR", userId: "screenshot-uid"),
            PaymentRecord(id: "p2", date: due(-5), amount: 119, subscriptionName: "Spotify",
                          subscriptionId: "s2", currency: "INR", userId: "screenshot-uid"),
            PaymentRecord(id: "p3", date: due(-9), amount: 149, subscriptionName: "YouTube Premium",
                          subscriptionId: "s4", currency: "INR", userId: "screenshot-uid"),
            PaymentRecord(id: "p4", date: due(-18), amount: 75, subscriptionName: "iCloud+",
                          subscriptionId: "s3", currency: "INR", userId: "screenshot-uid"),
            PaymentRecord(id: "p5", date: due(-33), amount: 649, subscriptionName: "Netflix",
                          subscriptionId: "s1", currency: "INR", userId: "screenshot-uid"),
            PaymentRecord(id: "p6", date: due(-61), amount: 1499, subscriptionName: "Amazon Prime",
                          subscriptionId: "s6", currency: "INR", userId: "screenshot-uid"),
        ]
    }
}
