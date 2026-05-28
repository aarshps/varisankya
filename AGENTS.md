# AI Agents Context

This repository utilizes AI agents (such as Claude Code, Gemini CLI, Cline, etc.) for development, maintenance, and orchestration.

## Branch Strategy (READ FIRST)

This repo has exactly **one canonical branch**: **`main`**. Everything you do should land on `main` unless the user explicitly tells you otherwise.

- ✅ **`main`** — the only active development branch. The Varisankya subscription-manager app. All releases (tags `v3.5`, `v3.7`, `v3.8` + its `v3.8-*` betas, ongoing) are cut from here.
- ❌ **`master`** — **removed**. There was previously a `master` branch carrying a minimal "Hello World + Google Sign-In" starter (the seed of the project); it was deleted from the remote on the v3.8-beta.5 cleanup pass and is not coming back. If a `master` branch ever reappears, it is not authoritative — work on `main`.
- ✅ **Wiki** (`varisankya-android.wiki` repo) — human-facing docs live on the wiki's `master` branch (GitHub wikis only have one branch). The wiki documents `main`-branch behavior.

Companion repos:

| Repo | Active branch | What lives there |
| --- | --- | --- |
| `varisankya-android` | `main` | App source code (this file is here) |
| `varisankya-android.wiki` | `master` | Human-facing documentation |

If you ever find yourself on `master` of this repo: switch back to `main` (`git checkout main`).

## Core Agent Mandates

1. **Security First:** Agents must NEVER log, print, stage, or commit secrets, API keys, keystores, or sensitive credentials. All deployment secrets and API keys for this project are securely managed via Bitwarden. 
   - **Important:** The project now builds on a headless Ubuntu Linux machine.
   - Run `./retrieve_secrets.sh` to extract the keystore and Firebase config securely from Bitwarden CLI into the local workspace (`app/google-services.json`, `varisankya-upload-key`, and `local.properties`).
2. **Context Efficiency:** Agents should minimize unnecessary context usage by targeting file reads and searches efficiently.
3. **Engineering Standards:** Adhere strictly to existing workspace conventions, architectural patterns, and styling. Never bypass type systems or suppress warnings without explicit user instruction.
   - **Firestore Models:** Ensure all data classes used with Firebase Firestore (e.g., `Subscription`, `PaymentRecord`) are explicitly preserved in `app/proguard-rules.pro` to prevent R8 serialization errors in release builds.
4. **Validation:** Agents must empirically validate all changes (e.g., compile checks with `./gradlew assembleDebug`, linting, tests) before considering a task complete.

## Operational Workflows
* **Execution:** Operate in a Plan -> Act -> Validate cycle.
* **Session Closing:** Before closing a session, agents MUST follow the `Agent Session Closing Protocol` (see `.agent/skills/agent-session-closing/SKILL.md`) to update documentation, clean up, and push changes to the repository.
* **Tool Usage:** Prefer specific tools (e.g., targeted file replacement) over rewriting entire files. Run commands non-interactively where possible.
* **Headless Build Environment:** The project is configured for Linux CLI builds without Android Studio. `ANDROID_HOME` is set to `~/Android/Sdk`.
* **Releases:** See `CLI_RELEASE_GUIDE.md` for building and distributing updates via GitHub or Google Play Console. The Play Store **"What's New"** is **not** the GitHub release body — it comes from `app/src/main/play/release-notes/en-US/default.txt` (≤ 500 chars) and is pushed automatically by `publishBundle`. Update that file on every release.

## Design Invariants — do NOT "clean up" these

Decisions accumulated over the v3.8-beta line. Each looks like dead code or unnecessary complexity at first glance, but every one is a fix for a specific, reproduced bug. Reverting any of them recreates the bug. If you genuinely believe one is wrong, raise it with the user before changing.

1. **Material You Dynamic Colors are enabled** in `VarisankyaApplication.onCreate`. The comment "Brand Monochrome Identity" elsewhere in the codebase is **historical** — the brand-monochrome stance was reversed in v3.8-beta.9 because it produced too-similar `colorPrimary` / `colorOnPrimary` shades that broke FAB readability among other things. Do **not** comment out `DynamicColors.applyToActivitiesIfAvailable(this)`.

2. **Extended FAB colours are set in Kotlin, not XML.** `MainActivity.applyFabColours(fab)` runs after inflation and sets `backgroundTintList`, `setTextColor`, `iconTint` programmatically to the `colorPrimaryContainer` / `colorOnPrimaryContainer` pair. Material 3's `ExtendedFloatingActionButton` style in `material:1.14.0-alpha08` silently swallows `android:textColor` set in XML — the `textAppearance` cascade wins. We confirmed this in beta.7/.8/.9 by watching the icon tint apply correctly while the text stayed at the wrong colour. Setting via XML is unreliable; setting via Kotlin survives.

3. **Notification channel ID is `subscription_reminders_v3` with `IMPORTANCE_DEFAULT`.** Earlier versions used `IMPORTANCE_LOW` which posted silently (no sound, no peek), so users genuinely couldn't tell when notifications were firing. Android caches per-channel importance — bumping the level requires a NEW channel ID. The worker also deletes legacy `subscription_reminders` / `_v1` / `_v2` channels on first run. Don't downgrade the importance or reuse a legacy id.

4. **The notification worker is a chained one-shot, not a `PeriodicWorkRequest`.** `SubscriptionNotificationWorker.scheduleNext(context, replacing)` is the single entry point. It enqueues a `OneTimeWorkRequest` whose `setInitialDelay` is computed from the **current** local-wall-clock time to the user's chosen hour:minute. At the end of `doWork()`, the worker calls `scheduleNext(replacing = true)` on itself, so every run is freshly anchored to the user's local time — DST and timezone-travel are handled automatically. Call sites: `MainActivity.setupNotifications` (`replacing=false`, KEEP), `SettingsActivity.rescheduleNotifications` (`replacing=true`, REPLACE), the worker's own end-of-run, and `receiver/SystemEventReceiver` on `ACTION_TIMEZONE_CHANGED` / `ACTION_TIME_SET` (`replacing=true`). **Do NOT convert this back to `PeriodicWorkRequest`** — that drifts because periodic intervals fire on absolute UTC milliseconds, not local wall-clock time.

5. **Due-date math in `SubscriptionNotificationWorker` is UTC on both sides.** Both `LocalDate.now(utcZone)` and `dueDate.toInstant().atZone(utcZone).toLocalDate()` use `ZoneId.of("UTC")`. The original code computed `LocalDate.now()` (device-local) and subtracted from the UTC `dueLocalDate`, which silently skipped notifications on boundary dates for users in IST. Due dates are stored as UTC midnight by `MaterialDatePicker`, so UTC on both sides is the correct invariant.

6. **Payments are dual-written.** Every payment write goes to BOTH the legacy nested path (`users/{uid}/subscriptions/{sid}/payments/{pid}`, atomic with `dueDate` update in a batch) AND a flat per-user collection (`users/{uid}/payments/{pid}`) for fast All-Payments reads. The flat write is best-effort; the nested write is authoritative. Helpers are in `util/PaymentRepository`. See `PAYMENT_MIGRATION_PLAN.md`.

7. **Analytics events are scalar params only.** `util/Analytics.kt` is the single source of event names; new events go through that wrapper. **Never** log subscription names, merchant strings, amounts, document IDs, or any free-form / high-cardinality value — Firebase Analytics has soft caps (40 distinct values per text parameter) and the event taxonomy should stay readable in the console. Booleans, ints, ISO codes, enumerated strings only.

8. **Test files are placeholders.** `app/src/test/.../ExampleUnitTest.kt` and `app/src/androidTest/.../ExampleInstrumentedTest.kt` are template files left over from project init. Don't expand the test scaffolding without first asking the user — they may want a coherent test plan rather than ad-hoc additions.

9. **No `android.widget.Toast` anywhere in the app.** All transient feedback (errors, confirmations, "done" pings) uses `com.google.android.material.snackbar.Snackbar`. The system Toast looks out of place against the M3 + Dynamic Colors UI and breaks the brand. If you need to surface an error, find the activity's content root (`mainContentRoot` in `MainActivity`, or `findViewById(android.R.id.content)`) and call `Snackbar.make(...)`. Search the codebase for `Toast.makeText` before committing — there should be zero hits.
