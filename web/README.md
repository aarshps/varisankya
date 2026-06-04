# Varisankya Web

The web version of **Varisankya** — a subscription / recurring-payment tracker
in the Hora app family. It connects to the **same Firebase project** as the
Android and iOS apps (`helloworld-92567418`), so a user's subscriptions and
payment history sync in real time across every platform.

- **Stack:** Next.js (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **Backend:** Firebase Auth (Google) + Cloud Firestore (shared with native apps)
- **PWA:** installable, offline app shell
- **Design:** monochrome palette (mirrors Android) + glass cards / rounded font
  (mirrors iOS)

## Data model (shared with Android/iOS — do not change field names)

```
users/{uid}/subscriptions/{sid}
  { name, dueDate, cost, currency, recurrence, category, active, autopay }
users/{uid}/subscriptions/{sid}/payments/{pid}   ← authoritative
users/{uid}/payments/{pid}                        ← flat mirror (fast reads)
```

Payments are dual-written; "mark paid" advances `dueDate` (UTC math) atomically
with the nested payment write. See `lib/firestore.ts` and `lib/recurrence.ts`.

## Local development

1. Install deps:

   ```bash
   npm install
   ```

2. Create `.env.local` from the template and fill in the two missing values:

   ```bash
   cp .env.example .env.local
   ```

   Get `NEXT_PUBLIC_FIREBASE_API_KEY` and `NEXT_PUBLIC_FIREBASE_APP_ID` from
   **Firebase Console → Project settings → General → Your apps → Web app** for
   project `helloworld-92567418`. If no Web app is registered yet, click
   **Add app → Web** to create one (this is what produces the SDK config; the
   existing OAuth web client is separate). The other values are pre-filled.

3. In **Firebase Console → Authentication → Settings → Authorized domains**, make
   sure `localhost` is listed (it is by default).

4. Run:

   ```bash
   npm run dev      # http://localhost:3000
   npm run test     # domain-logic parity tests (recurrence, currency, hero)
   npm run build    # production build
   npm run lint
   ```

These `NEXT_PUBLIC_*` values are **not secret** — they ship to the browser and
access is enforced by Firestore security rules keyed on the auth UID.

## Deploy to Vercel (team `aarshps`)

1. Push this repo to GitHub, then import it into Vercel under the **aarshps**
   team (framework preset auto-detects **Next.js**).
2. Add the `NEXT_PUBLIC_FIREBASE_*` environment variables (Production + Preview)
   with the same values as `.env.local`.
3. After the first deploy, add the production domain (e.g.
   `varisankya-web.vercel.app`) and any custom domain to **Firebase Console →
   Authentication → Settings → Authorized domains** so Google sign-in works.
4. Add the same domain to the **Google Cloud Web OAuth client**:
   `https://<domain>/__/auth/handler` under *Authorized redirect URIs* and
   `https://<domain>` under *Authorized JavaScript origins*. Sign-in serves the
   Firebase auth handler **same-origin** (reverse-proxied in `next.config.ts`;
   `authDomain = window.location.hostname` in `lib/firebase.ts`) so
   `signInWithRedirect` survives mobile third-party-storage partitioning —
   without these OAuth-client entries it fails with `redirect_uri_mismatch`.

## Firestore security rules

Rules are keyed on `request.auth.uid`, so the web client needs no changes.
Verify the rules cover the flat mirror path `users/{uid}/payments/{pid}` (the
native apps write it); if absent, add a matching `match` block.

## Not yet implemented (parity follow-ups)

- **Web-push reminders.** Notification time / days-before preferences are saved
  but inert until FCM web push + a scheduler (cron/Cloud Function) is added.
- **App Lock.** The native biometric lock has no direct web equivalent; omitted
  in v1 (a WebAuthn/passkey gate is a possible follow-up).
