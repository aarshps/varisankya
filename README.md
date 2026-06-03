# Varisankya

**Varisankya** is a cross-platform subscription & recurring-payment tracker in the
**Hora** app family. Android, iOS, and Web are developed together in this single
repository and all talk to **one** Firebase project (`helloworld-92567418`) — sign in
on any platform and see the same subscriptions and payment history in real time.

> This monorepo unifies what were previously three separate repos
> (`varisankya-android`, `varisankya-ios`, `varisankya-web`), now archived. Full
> commit history of each app is preserved here under its subdirectory.

## Repository layout

```
.
├── android/      Kotlin · Android 15+ · Material 3 Expressive · MVVM
├── ios/          SwiftUI · iOS 26+ Liquid Glass · XcodeGen
├── web/          Next.js (App Router) · React 19 · TypeScript · Tailwind v4 · PWA
└── shared/       Single-sourced contracts shared by all three platforms
    ├── firebase/   firestore.rules + firebase.json + .firebaserc (the backend contract)
    └── domain/     SPEC.md (canonical behaviour) + golden-vectors.json (parity tests)
```

Each platform keeps its own detailed docs in its subdirectory (e.g.
`android/README.md`, `ios/README.md`, `web/README.md`). The full project handbook
lives in the **[wiki](https://github.com/aarshps/varisankya/wiki)** (one wiki for the
whole project).

## Shared backend — one Firebase project

All clients use Firebase Auth (Google everywhere; Sign in with Apple additionally on
iOS) and Cloud Firestore in project **`helloworld-92567418`**. The Firestore document
layout is identical across platforms:

```
users/{uid}/subscriptions/{subId}                      subscription doc
users/{uid}/subscriptions/{subId}/payments/{paymentId} payments (authoritative)
users/{uid}/payments/{paymentId}                       flat mirror (fast All-Payments reads)
```

Payments are **dual-written**; "mark paid" advances `dueDate` (UTC math) atomically
with the nested payment write. Recurrence strings (`"Monthly"`, `"Every 3 Months"`,
`"Custom"`, …) encode the same way on every platform. The authoritative description of
this behaviour — and the golden test vectors every platform must satisfy — live in
[`shared/domain/`](shared/domain/SPEC.md).

Security is enforced by Firestore rules keyed on `request.auth.uid` (see
[`shared/firebase/firestore.rules`](shared/firebase/firestore.rules)), **not** by hiding
client config. Deploy rules with:

```bash
cd shared/firebase && firebase deploy --only firestore:rules
```

## Per-platform quick start

### Web (`web/`)
```bash
cd web
npm install
cp .env.example .env.local      # fill NEXT_PUBLIC_FIREBASE_API_KEY + ..._APP_ID
npm run dev                      # http://localhost:3000
npm test                         # domain-parity tests (vitest)
npm run build
```
The `NEXT_PUBLIC_*` values are public by design (they ship to the browser; access is
gated by Firestore rules).

### Android (`android/`)
```bash
cd android
# place google-services.json in app/  (gitignored — fetch from Firebase console / Bitwarden)
./gradlew :app:assembleDebug     # -> app/build/outputs/apk/debug/app-debug.apk
```
Min SDK 35 / Target 36, 100% Kotlin, Material 3. See `android/CLI_RELEASE_GUIDE.md`.

### iOS (`ios/`, macOS only)
```bash
cd ios
brew install xcodegen
xcodegen generate                # .xcodeproj is generated, not committed
open Varisankya.xcodeproj
# place GoogleService-Info.plist in Varisankya/Resources/ (gitignored)
```
SwiftUI, iOS 26+ Liquid Glass. Bundle id `com.hora.varisankya`. See `ios/APPLE_RUNBOOK.md`.

## Secrets

No credentials are committed. Signing keys, keystores, `google-services.json`,
`GoogleService-Info.plist`, service-account keys, and `.env.local` files are all
gitignored (see the root `.gitignore`) and fetched out-of-band. Public client config
(Firebase web API keys, etc.) is not secret and is protected by Firestore rules.

## License

MIT.
