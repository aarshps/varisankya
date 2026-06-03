"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  getAnalytics,
  isSupported as analyticsIsSupported,
  type Analytics,
} from "firebase/analytics";

/**
 * Connects to the SAME Firebase project as the Android/iOS clients
 * (helloworld-92567418) so subscriptions and payments sync across platforms.
 *
 * These NEXT_PUBLIC_* values are public by design (they ship to the browser);
 * security is enforced by Firestore rules keyed on the auth UID. Fill them in
 * from Firebase Console → Project settings → Web app. See .env.example.
 */
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
    cache = { app, auth: getAuth(app), db: getFirestore(app) };
  }
  return cache;
}

// Lazy proxies: initialization is deferred until a property is actually read
// (always client-side), so module evaluation during SSR/prerender never calls
// getAuth/getFirestore with a missing key.
export const auth = new Proxy({} as Auth, {
  get: (_t, prop) => Reflect.get(services().auth, prop),
});

export const db = new Proxy({} as Firestore, {
  get: (_t, prop) => Reflect.get(services().db, prop),
});

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
