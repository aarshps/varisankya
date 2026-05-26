# AI Agents Context

This repository utilizes AI agents (such as Claude Code, Gemini CLI, Cline, etc.) for development, maintenance, and orchestration.

## Branch Strategy (READ FIRST)

This repo has exactly **one canonical branch**: **`main`**. Everything you do should land on `main` unless the user explicitly tells you otherwise.

- ✅ **`main`** — the only active development branch. The Varisankya subscription-manager app. All releases (tags `v3.5`, `v3.7`, `v3.8-*`, ongoing) are cut from here.
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
* **Releases:** See `CLI_RELEASE_GUIDE.md` for building and distributing updates via GitHub or Google Play Console.

## Design Invariants — do NOT "clean up" these

Decisions accumulated over the v3.8-beta line. Each looks like dead code or unnecessary complexity at first glance, but every one is a fix for a specific, reproduced bug. Reverting any of them recreates the bug. If you genuinely believe one is wrong, raise it with the user before changing.

1. **Material You Dynamic Colors are enabled** in `VarisankyaApplication.onCreate`. The comment "Brand Monochrome Identity" elsewhere in the codebase is **historical** — the brand-monochrome stance was reversed in v3.8-beta.9 because it produced too-similar `colorPrimary` / `colorOnPrimary` shades that broke FAB readability among other things. Do **not** comment out `DynamicColors.applyToActivitiesIfAvailable(this)`.

2. **Extended FAB colours are set in Kotlin, not XML.** `MainActivity.applyFabColours(fab)` runs after inflation and sets `backgroundTintList`, `setTextColor`, `iconTint` programmatically to the `colorPrimaryContainer` / `colorOnPrimaryContainer` pair. Material 3's `ExtendedFloatingActionButton` style in `material:1.14.0-alpha08` silently swallows `android:textColor` set in XML — the `textAppearance` cascade wins. We confirmed this in beta.7/.8/.9 by watching the icon tint apply correctly while the text stayed at the wrong colour. Setting via XML is unreliable; setting via Kotlin survives.

3. **Notification channel ID is `subscription_reminders_v3` with `IMPORTANCE_DEFAULT`.** Earlier versions used `IMPORTANCE_LOW` which posted silently (no sound, no peek), so users genuinely couldn't tell when notifications were firing. Android caches per-channel importance — bumping the level requires a NEW channel ID. The worker also deletes legacy `subscription_reminders` / `_v1` / `_v2` channels on first run. Don't downgrade the importance or reuse a legacy id.

4. **`MainActivity.setupNotifications` uses `ExistingPeriodicWorkPolicy.KEEP`, not `UPDATE`.** Cold-start scheduling with `UPDATE` was perpetually rescheduling the periodic worker to "next 8 AM relative to now" on every app open — for users who open the app before 8 AM, the worker was being pushed forward without ever firing. `KEEP` makes cold starts a no-op when a schedule already exists. The Settings *change-the-time* path (`SettingsActivity.rescheduleNotifications`) still uses `UPDATE`, which is the legitimate "user explicitly changed the schedule" case.

5. **Due-date math in `SubscriptionNotificationWorker` is UTC on both sides.** Both `LocalDate.now(utcZone)` and `dueDate.toInstant().atZone(utcZone).toLocalDate()` use `ZoneId.of("UTC")`. The original code computed `LocalDate.now()` (device-local) and subtracted from the UTC `dueLocalDate`, which silently skipped notifications on boundary dates for users in IST. Due dates are stored as UTC midnight by `MaterialDatePicker`, so UTC on both sides is the correct invariant.

6. **Payments are dual-written.** Every payment write goes to BOTH the legacy nested path (`users/{uid}/subscriptions/{sid}/payments/{pid}`, atomic with `dueDate` update in a batch) AND a flat per-user collection (`users/{uid}/payments/{pid}`) for fast All-Payments reads. The flat write is best-effort; the nested write is authoritative. Helpers are in `util/PaymentRepository`. See `PAYMENT_MIGRATION_PLAN.md`.

7. **Analytics events are scalar params only.** `util/Analytics.kt` is the single source of event names; new events go through that wrapper. **Never** log subscription names, merchant strings, amounts, document IDs, or any free-form / high-cardinality value — Firebase Analytics has soft caps (40 distinct values per text parameter) and the event taxonomy should stay readable in the console. Booleans, ints, ISO codes, enumerated strings only.

8. **Test files are placeholders.** `app/src/test/.../ExampleUnitTest.kt` and `app/src/androidTest/.../ExampleInstrumentedTest.kt` are template files left over from project init. Don't expand the test scaffolding without first asking the user — they may want a coherent test plan rather than ad-hoc additions.
