import Foundation

/// Build/run environment flags.
///
/// `isScreenshotMode` is true ONLY when the app is launched with the
/// `-screenshotMode` argument, which is injected by the App Store screenshot
/// CI job (`.github/workflows/ios-screenshots.yml`) via `simctl launch`.
/// App Store / TestFlight builds cannot inject launch arguments, so every code
/// path gated on this flag is unreachable for real users — it exists purely so
/// CI can render populated screens without Google/Apple sign-in or Firebase.
enum AppEnv {
    static let isScreenshotMode: Bool =
        ProcessInfo.processInfo.arguments.contains("-screenshotMode")

    /// Which screen the screenshot run should open to (`-screenshotScreen <name>`).
    /// Recognised: `home` (default), `add`, `settings`, `history`.
    static var screenshotScreen: String {
        let args = ProcessInfo.processInfo.arguments
        guard let i = args.firstIndex(of: "-screenshotScreen"), i + 1 < args.count else {
            return "home"
        }
        return args[i + 1]
    }
}
