import SwiftUI
import FirebaseCore
import FirebaseAuth
import GoogleSignIn
import UserNotifications

@main
struct VarisankyaApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var auth = AuthService.shared
    @State private var preferences = Preferences.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(auth)
                .environment(preferences)
                .preferredColorScheme(preferences.appearance.colorScheme)
                .fontDesign(preferences.useGoogleFont ? .rounded : .default)
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
        }
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Skip Firebase entirely in screenshot mode (CI runs with a placeholder
        // GoogleService-Info and no real project).
        if !AppEnv.isScreenshotMode {
            FirebaseApp.configure()
        }
        UNUserNotificationCenter.current().delegate = NotificationDelegate.shared
        return true
    }

    // Google Sign-In URL callbacks are forwarded via SwiftUI's `.onOpenURL` in
    // VarisankyaApp — no UIApplicationDelegate URL hook needed. The legacy
    // `application(_:open:options:)` method is deprecated in iOS 26 in favour
    // of UIScene-based handling, which `.onOpenURL` is built on.
}
