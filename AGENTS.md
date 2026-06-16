# AI Agents Context — Varisankya Monorepo

Authoritative context for AI agents (Claude Code, Gemini CLI, Codex, etc.) working across this repo. Per-platform detail is in each platform's own `AGENTS.md`; this file covers cross-cutting concerns.

Keep this file current when conventions change. Do **not** add per-session activity logs — git history is the record.

---

## Repo layout

```
varisankya/
├── android/    Kotlin + Gradle app  →  android/AGENTS.md
├── ios/        Swift + XcodeGen app →  ios/AGENTS.md
├── web/        Next.js app-router   →  web/AGENTS.md (references web/AGENTS.md)
└── shared/
    ├── firebase/   firestore.rules, firebase.json, .firebaserc
    └── domain/     SPEC.md (canonical data model), golden-vectors.json
```

All three apps talk to the **same Firebase project**: `helloworld-92567418`.

---

## Core mandates (apply everywhere)

1. **Security is the top priority.** Never commit secrets, keys, or tokens. Before any force-push or history-rewrite, grep the full git history for: private key patterns (`BEGIN.*PRIVATE KEY`), Firebase API keys (`AIza`), OAuth secrets (`GOCSPX-`), service-account JSON (`play_console_key`). See [[security-utmost-priority]].

2. **Secret management = Bitwarden CLI (`bw`).** The unlock pattern is settled — see `DISASTER_RECOVERY.md §ADR-001` (do not re-litigate). Quick reference:
   - Credentials file: `.env` at repo root (`BW_CLIENTID`, `BW_CLIENTSECRET`, `BW_PASSWORD`). Template: `.env.example`. Must be `chmod 600`.
   - **Preferred unlock helper:** `source scripts/bw_unlock.sh` — handles login + unlock idempotently.
   - Legacy Android-only path: `android/.env.local` (key `BW_PASSWORD`); still used by `android/retrieve_secrets.sh`.
   - On Windows, `bw` is at `C:\Users\Aarsh\AppData\Roaming\npm\bw.cmd` — use the full path from Python subprocess.
   - See `android/.agent/skills/bitwarden-secrets/SKILL.md` for the skill definition.

3. **Firestore data model must stay identical across platforms.** `shared/domain/SPEC.md` is the canonical definition. Field names, types, recurrence strings, and payment dual-write layout must match between Android, iOS, and web. If you change a field name on one platform, update all three and the spec.

4. **Web auth uses a same-origin reverse-proxy.** `web/next.config.ts` proxies `/__/auth/*` to Firebase. `authDomain` is set to `window.location.hostname`. Any new domain must be added to the Google OAuth 2.0 Web client's Authorized redirect URIs (`<domain>/__/auth/handler`) and Authorized JavaScript origins.

5. **No cross-language code generation.** Kotlin/Swift/TypeScript cannot share compiled code without KMP or a shared-TS core — both are out of scope. Shared logic lives in the domain spec + golden test vectors, not in generated code.

6. **Commit directly to `main` (repo) and `master` (wiki) — never open pull requests or feature branches.** The owner manages these repos directly and explicitly does not want PRs. When asked to commit code, docs, or wiki changes, push straight to the default branch. This **overrides** any default "branch first on the default branch" agent behaviour. (Still applies: only commit/push when the user asks, and never bypass mandate 1 — no secrets, ever.)

---

## Build machines

| Platform | OS | Notes |
| --- | --- | --- |
| Android | **Windows 11** | SDK `C:\Users\Aarsh\AppData\Local\Android\Sdk`; Java 17 OpenJDK; Gradle 9.1 |
| iOS | macOS / GitHub Actions `macos-latest` + Xcode 26 | No local Mac; CI (`ios-build.yml`) is the only build path on Windows |
| Web | Windows 11 / Vercel | `cd web && npm run dev` locally; `vercel deploy` for staging |

---

## Firebase project

| Item | Value |
| --- | --- |
| Project ID | `helloworld-92567418` |
| Firestore rules | `shared/firebase/firestore.rules` |
| Config (Android) | `android/app/google-services.json` (gitignored; 3 active SHA-1s) |
| Config (iOS) | `ios/Varisankya/Resources/GoogleService-Info.plist` (gitignored) |
| Config (Web) | `web/.env.local` `NEXT_PUBLIC_FIREBASE_*` keys (gitignored) |
| Active SHA-1 fingerprints | Play app signing (`D0:FB:3D:47…`), upload keystore (`4E:2E:B5:C5…`), Windows debug (`DC:55:9C:26…`) |

---

## Playwright browser automation (agent tool)

When using Playwright MCP to drive browser UI, prefer `browser_evaluate` over `browser_click` for any selector that is not a simple CSS id or plain aria-label:

```js
// Prefer this pattern — works even when pointer-events are blocked by overlapping elements
await page.evaluate(() => {
  Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent.trim() === 'Delete')
    ?.click();
});
```

Known gotchas encountered in this project:
- **Play Console** — the spinner sometimes never hides; take a screenshot to confirm load, then navigate by extracted `href` instead of waiting.
- **Firebase Console delete button** — a `<td>` intercepts pointer events; use `dispatchEvent(new MouseEvent('click', {bubbles:true}))` on the button directly.
- **Google account signup QR code** — expires in ~3 minutes; always scan immediately when shown.
- **`browser_click` with smart-quoted aria labels** — fails with CSS selector error; use `browser_evaluate` with `textContent.trim()` comparison.
- **`bw` pipe through heredoc on Windows** — `bw create item "$(cat <<'EOF'...)"` fails with "Error parsing encoded request data"; use Python subprocess with `bw encode` + `bw create item` as two steps.

---

## Current release state (2026-06-16)

| Platform | Version | Track / Status |
| --- | --- | --- |
| Android | v3.9-beta.5 (versionCode 62) | Play **Beta** (Open Testing) — also internal + closed; solid-disc / hollow-വ notification icon (Hora-family standard) |
| iOS | 3.8 (build auto-bumped by CI) | Awaiting Apple enrollment (cases #102900128848 + #102905434551) |
| Web | latest `main` | Vercel production |

> **Release tracks:** Varisankya is past Play's one-time 12-testers × 14-days testing gate (production since v3.8), so betas publish straight to **Open Testing** (GPP `track` defaults to `beta`) — *not* gated to internal/closed. The `hora-app-release` skill's internal→closed flow is a skeleton for new apps still under the gate. See the wiki **Build & Release** page.

### App Store reviewer test account (iOS)

| Field | Value |
| --- | --- |
| Email | `varisankya148@gmail.com` |
| Method | Google Sign-In |
| Password | Bitwarden: *"varisankya148@gmail.com - App Store reviewer test account"* |
| Created | 2026-06-06; recovery email `aarshps@gmail.com` |

---

## CI

| Workflow | Trigger | Platform |
| --- | --- | --- |
| `android-build.yml` | push/PR to `android/**` | Ubuntu; lint + debug APK |
| `ios-build.yml` | push to `main` | macOS; unsigned device build |
| `ios-release.yml` | manual / `v*` tag | macOS; signed IPA → TestFlight |

---

## Disaster Recovery

Full DR runbooks, secret inventory, vault coverage audit, and 2FA recovery
locations are documented in **`DISASTER_RECOVERY.md`** at the repo root.
That document also contains the ADR explaining the `.env` / master-password
design (§ADR-001) — treat it as settled.

Key helpers:
- `scripts/bw_unlock.sh` — sources `.env`, logs in via API key, unlocks vault, exports `BW_SESSION`. Source it before any `bw get` call.
- `android/retrieve_secrets.sh` — pulls Android secrets from the `Varisankya` BW item (calls `bw_unlock.sh` internally via the `.env.local` fallback).
- `ios/scripts/check_apple_secrets.sh` — audits the 9 GitHub Secrets required for the iOS release workflow.

---

## Gitignored secrets (never commit these)

```
*.pem  *.csr  *.p12  *.cer  *.mobileprovision
google-services.json  GoogleService-Info.plist
*.env.local  play_console_key.json
varisankya-upload-key  AuthKey_*.p8
```

The root `.gitignore` enforces these. Each platform directory also has its own `.gitignore`. Belt-and-suspenders intentional.
