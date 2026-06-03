import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

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

export const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Web version uses Google sign-in only (same accounts as the native apps).
export const googleProvider = new GoogleAuthProvider();

// Offline-first parity with the native apps: IndexedDB-backed persistent cache so
// the home screen renders instantly and writes queue while offline. Guarded so it
// only runs in the browser (initializeFirestore must run exactly once).
export const db = initializeFirestore(app, {
  localCache:
    typeof window !== "undefined"
      ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      : undefined,
});
