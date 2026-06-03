"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import {
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
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/** True only when the SDK config is present (avoids throwing at build time). */
export const firebaseReady = Boolean(firebaseConfig.apiKey);

interface Services {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let cache: Services | null = null;

function services(): Services {
  if (!cache) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    // Offline-first parity with the native apps: an IndexedDB-backed persistent
    // cache (browser only) so the home screen renders instantly and writes queue
    // while offline. On the server (SSR/prerender) fall back to defaults.
    // initializeFirestore must run exactly once per app.
    const db = initializeFirestore(app, {
      localCache:
        typeof window !== "undefined"
          ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
          : undefined,
    });
    cache = { app, auth: getAuth(app), db };
  }
  return cache;
}

// Lazy proxies: initialization is deferred until a property is actually read
// (always client-side), so module evaluation during SSR/prerender never calls
// getAuth/initializeFirestore with a missing key.
export const auth = new Proxy({} as Auth, {
  get: (_t, prop) => Reflect.get(services().auth, prop),
});

export const db = new Proxy({} as Firestore, {
  get: (_t, prop) => Reflect.get(services().db, prop),
});

// Web version uses Google sign-in only (same accounts as the native apps).
export const googleProvider = new GoogleAuthProvider();

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
      if (ok) analyticsInstance = getAnalytics(services().app);
    })
    .catch(() => {});
}

export function getAnalyticsClient(): Analytics | null {
  maybeInitAnalytics();
  return analyticsInstance;
}
