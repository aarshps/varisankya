# Ubuntu CLI Build & Release Transition Plan

This document outlines the strategy for transitioning Varisankya's Android build and Play Store release process from a Windows/Android Studio environment to a headless Ubuntu environment using Gemini CLI.

## Goal
Enable fully automated creation of Debug APKs and Production App Bundles, including direct pushes to the Google Play Store, from this Linux machine.

## Phase 1: Environment Setup (COMPLETED)
- **JDK 17**: Installed via apt.
- **Android SDK Command-line Tools**: Installed at `~/Android/Sdk` (`cmdline-tools;latest`, `platforms;android-36`, `build-tools;36.0.0`).
- **Environment Variables**: `ANDROID_HOME` is set in `~/.bashrc`.
- **SDK Path**: `local.properties` contains `sdk.dir=/home/aarsh/Android/Sdk`.
- **Firebase Auth (Google Sign-In)**: The default `debug.keystore` generated on a new Linux environment has a unique SHA-1. This SHA-1 must be manually registered in the Firebase Console (or via `firebase apps:android:sha:create`) for Google Sign-In to function properly on debug builds.

## Phase 2: Secret Injection (COMPLETED)
- **Bitwarden CLI (`bw`)**: Installed and configured.
- **Automated Script**: `./retrieve_secrets.sh` securely unlocks the vault, downloads the `Varisankya` secure note, and injects:
  1. `app/google-services.json`
  2. `varisankya-upload-key`
  3. Release signing credentials into `local.properties` (non-committed).

## Phase 3: Automation Integration (COMPLETED)
To automate Play Store pushes, we use the **Gradle Play Publisher (GPP)** plugin.
- **Dependency**: Added `com.github.triplet.play` (v4.0.0) to `build.gradle.kts` files.
- **Auth**: A Service Account JSON key from the Google Play Console is securely retrieved from Bitwarden via `./retrieve_secrets.sh` and placed at `app/play_console_key.json` (ignored by Git).

## Phase 4: Execution

> **Release-channel policy (owner-directed, 2026-07-22 — supersedes the 2026-07-10 policy below).**
> The owner is mostly the sole tester right now, and Closed Testing (`alpha`) rolls out to
> testers near-instantly with no review wait, unlike Open Testing (`beta`) which is public
> and subject to Play's review pipeline. So the iteration channel is now **Closed Testing
> (`alpha`)**, not Open Testing — `./gradlew publishBundle` defaults to `alpha` (see
> `play { track.set(...) }` in `app/build.gradle.kts`). Open Testing is no longer part of
> the regular loop; revisit it only if/when public beta testers are actually wanted.
> This is a **Varisankya-specific** reversal — it does **not** apply to Pathivu or the rest
> of the family, which still follow the 2026-07-10 two-channel (`beta`/`production`) policy
> recorded in `hora-core/docs/agent-resume.md`.
>
> One-time setup this reversal depends on: the `alpha` track's tester list was empty (the
> Android Publisher API can only manage Google-Group testers, not raw email addresses, so
> this has to be done by hand) — **add your email under Play Console → Testing → Closed
> testing → alpha → Testers**, then open the track's opt-in URL once on your test device.
> Skipping this means builds publish successfully but nothing shows up as installable.
>
> ~~Previous policy (2026-07-10, retained for history): exactly two channels — Open Testing
> (`beta`) for every beta, Production for every stable cut; internal/alpha retired.~~
>
> **Every Play release must have a corresponding GitHub Release** — no exceptions:
> tag `v<versionName>`, signed release APK attached, marked **Pre-release** for betas
> and a normal release for stables. A build that reached a Play track without its
> GitHub Release is an unfinished release.

- **Debug APK**: `./gradlew assembleDebug`
- **Release APK**: `./gradlew assembleRelease`
- **Pre-release (Beta)**: Every beta gets a GitHub pre-release (with the signed **release** APK from `assembleRelease`) AND a Closed Testing release on the Play Store.
  - Play Store Closed Testing: `./gradlew publishBundle` (default track is `alpha`)
  - Falling back to Open Testing for a specific release: `./gradlew publishBundle -PplayTrack=beta`
- **Production (Live)**: Once a pre-release is tested and approved, we promote it to Production on the Play Store and create a standard GitHub release.
  - Play Store Production: `./gradlew publishBundle -PplayTrack=production`

## Play Store "What's New" (release notes)
GPP reads the Play Store changelog from `app/src/main/play/release-notes/en-IN/default.txt` and uploads it automatically as part of every `publishBundle` (any track). **This is the only source** — the GitHub release body is NOT used for Play.
- **Update this file on every release** *before* running `publishBundle`. Keep it ≤ **500 characters** (Google Play hard limit) — run `wc -m` on it first.
- `default.txt` applies to all tracks. Add `beta.txt` / `production.txt` siblings only if a track needs different copy.
- The notes attach to whatever `versionCode` is uploaded in that run. They **cannot** be re-attached to an already-uploaded `versionCode` via GPP (the artifact upload would conflict) — for that, edit the release notes directly in the Play Console, or push via the Play Developer API (`androidpublisher` edits: create edit → update `tracks/production` releaseNotes → commit), or upload a new `versionCode`.
- **Locale must match an active Play listing language.** Varisankya's only listing language (and its default) is **en-IN** — that's why the folder is `en-IN`. Using a locale the listing doesn't have (e.g. `en-US`) makes the API reject the notes.
- **Keep the text ASCII-only when pushing from the CLI on Windows.** The git-bash + `curl` pipeline mangles multibyte characters (em-dash `—`, bullet `•`) into spaces. Use `-` for bullets and a plain `-` for dashes. (Typing those glyphs directly in the Play Console UI is fine — only the CLI byte-path is affected.)
- If notes ever look wrong, verify the **stored** bytes, not the local file: `... | jq -r '.releases[].releaseNotes[].text' | od -An -tx1` and check there are no unexpected `e2 80 ..` (UTF-8) byte runs where ASCII was intended.

## Phase 5: GitHub Release Formatting
When publishing pre-releases or final releases to GitHub, always ensure the release notes are detailed and strictly formatted:
- **Title**: `vX.Y[-alpha.Z] - Concise Feature Summary [Emoji]` (e.g., `v3.8-alpha.2 - Login Crash Fix 🩹`)
- **Body**: Split into clear sections:
  ```markdown
  Brief summary of the release's purpose.

  ## ✨ What's New
  • Bullet point detailing a new feature or change.

  ## 🛠 Fixes & Improvements
  • Bullet point detailing a fix, like resolving a NullPointerException.
  • App Version Bump updated to [Version] (Version Code [Code]).

  Enjoying Varisankya? Consider leaving a star on GitHub! ⭐️
  ```

## Current Status
- Transitioned successfully to Ubuntu CLI on April 27, 2026.
- Pre-release APKs can be generated and published to GitHub.
- Google Play automation (GPP) is integrated and ready. Run `./retrieve_secrets.sh` to extract the key, and then `./gradlew publishBundle` to push to the store.
