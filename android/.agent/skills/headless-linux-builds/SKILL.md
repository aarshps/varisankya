---
name: Windows Android Builds
description: Building Varisankya Android from the CLI on Windows 11 without Android Studio.
---

# Windows Build Environment

Varisankya Android is built from **Windows 11** using Gradle CLI. Android Studio is not required.

> Note: earlier versions of this skill described a headless Ubuntu Linux environment. The build machine is now Windows.

## Key Infrastructure

| Item | Value |
| --- | --- |
| OS | Windows 11 Home (10.0.26100) |
| JDK | OpenJDK 17 (Temurin, any distribution) |
| Android SDK | `C:\Users\Aarsh\AppData\Local\Android\Sdk` |
| `local.properties` | `sdk.dir=C\:\\Users\\Aarsh\\AppData\\Local\\Android\\Sdk` |
| Gradle wrapper | `android/gradlew` (Bash) or `android/gradlew.bat` (PowerShell) |

## `local.properties` (gitignored — must exist before any build)

```
sdk.dir=C\:\\Users\\Aarsh\\AppData\\Local\\Android\\Sdk
RELEASE_STORE_FILE=../varisankya-upload-key
RELEASE_STORE_PASSWORD=<from Bitwarden>
RELEASE_KEY_ALIAS=key0
RELEASE_KEY_PASSWORD=<from Bitwarden>
```

The keystore path `../varisankya-upload-key` is relative to `android/app/`, resolving to `android/varisankya-upload-key` (also gitignored).

## Common Build Commands

Run from the `android/` directory:

```bash
# Debug build (fastest, no signing needed)
./gradlew assembleDebug

# Release bundle (signed) — used for Play Store
./gradlew bundleRelease

# Publish signed bundle to Play beta track (requires play_console_key.json)
./gradlew publishReleaseBundle

# Lint only
./gradlew lint
```

## Missing SDK Error

If the build fails with *"SDK location not found"*, ensure `android/local.properties` exists with the correct `sdk.dir` line.

## Secrets Recovery

Secrets (`google-services.json`, keystore, passwords) are stored in Bitwarden. Master password is in `android/.env.local` (gitignored):

```
BW_PASSWORD='...'
```

Unlock non-interactively:

```bash
BW_SESSION=$(bw unlock "$(grep BW_PASSWORD android/.env.local | sed "s/BW_PASSWORD='//;s/'//")" --raw)
```

Then retrieve whatever is needed:

```bash
bw --session "$BW_SESSION" get item "Varisankya"
```

## Validation

Always run `./gradlew assembleDebug` (or `bundleRelease`) to empirically validate code changes. Do not assume syntax is correct without compilation.
