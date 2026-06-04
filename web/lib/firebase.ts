"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import {
  getAnalytics,
  isSupported as analyticsIsSupported,
  type Analytics,
} from "firebase/analytics";

// Public Firebase web config for the shared `helloworld-92567418` project. These
// values are not secret — they ship inside every client (the native apps embed
// the same project via google-services.json / GoogleService-Info.plist).
// Security is enforced by Firestore rules, not by hiding this config.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // Serve the Firebase auth handler from THIS origin (see next.config rewrites)
  // so signInWithRedirect/popup state isn't lost to third-party-storage
  // partitioning on mobile/Safari. Falls back to the project default on the
  // server (prerender) where there is no window.
  authDomain:
    typeof window !== "undefined"
      ? window.location.hostname
      : process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/** True only when the SDK config is present. */
export const firebaseReady = Boolean(firebaseConfig.apiKey);

export const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Web version uses Google sign-in only (same accounts as the native apps).
export const googleProvider = new GoogleAuthProvider();

// IMPORTANT: db must be a REAL Firestore instance — firebase modular APIs like
// collection()/doc() do an `instanceof Firestore` check, so a Proxy wrapper
// breaks them ("Expected first argument to collection() to be a ...
// FirebaseFirestore"). In the browser we enable an IndexedDB persistent cache
// (offline-first parity with the native apps); on the server (SSR/prerender)
// we use a plain instance — it is never queried server-side.
export const db: Firestore =
  typeof window !== "undefined"
    ? initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      })
    : getFirestore(app);

// Analytics: browser-only and best-effort. Resolved once asynchronously
// (isSupported gates out SSR and unsupported environments). Callers get the
// instance synchronously via getAnalyticsClient() once it's ready.
let analyticsInstance: Analytics | null = null;
let analyticsTried = false;

function maybeInitAnalytics(): void {
  if (analyticsTried || typeof window === "undefined" || !firebaseReady) return;
  analyticsTried = true;
  analyticsIsSupported()
    .then((ok) => {
      if (ok) analyticsInstance = getAnalytics(app);
    })
    .catch(() => {});
}

export function getAnalyticsClient(): Analytics | null {
  maybeInitAnalytics();
  return analyticsInstance;
}
