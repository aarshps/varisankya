"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  deleteUser,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import {
  auth,
  firebaseReady,
  getAnalyticsClient,
  googleProvider,
} from "@/lib/firebase";
import { deleteAllUserData } from "@/lib/firestore";
import { analytics } from "@/lib/analytics";

interface AuthContextValue {
  user: User | null;
  initialized: boolean;
  /** Surfaces a sign-in error after a redirect round-trip (or a popup failure). */
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * `signInWithPopup` is unreliable in installed PWAs, on mobile, and in iOS
 * Safari: the popup may open but never relay its result back to the opener,
 * leaving the UI stuck on "Signing in…" forever (the promise neither resolves
 * nor rejects). In those environments we use a full-page redirect instead,
 * which has no popup-relay step. Desktop keeps the nicer popup, with a redirect
 * fallback if the popup is blocked.
 */
function prefersRedirect(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator;
  const ua = nav.userAgent || "";
  const standalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    (nav as Navigator & { standalone?: boolean }).standalone === true;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS reports as Macintosh but is touch-capable.
    (ua.includes("Macintosh") && "ontouchend" in document);
  const mobile = /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  return standalone || iOS || mobile;
}

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string }).code ?? "";
  switch (code) {
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";
    case "auth/network-request-failed":
      return "Network error — check your connection and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/unauthorized-domain":
      return "This domain isn't authorized for sign-in. Add it in Firebase Auth settings.";
    default:
      return (err as Error)?.message || "Sign-in failed — please try again.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Without SDK config there is nothing to listen to; mark initialized so the
    // UI can show the config notice instead of hanging on the splash.
    if (!firebaseReady) {
      setInitialized(true);
      return;
    }
    getAnalyticsClient(); // warm analytics (best-effort, browser-only)

    // Complete any pending redirect sign-in (mobile / PWA / popup fallback) and
    // surface errors instead of silently dropping the user back on this screen.
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) analytics.authSignIn("google");
      })
      .catch((err) => setAuthError(friendlyAuthError(err)));

    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitialized(true);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initialized,
      authError,
      signInWithGoogle: async () => {
        setAuthError(null);

        // Environments where the popup relay can't deliver its result: go
        // straight to a full-page redirect.
        if (prefersRedirect()) {
          await signInWithRedirect(auth, googleProvider);
          return;
        }

        try {
          await signInWithPopup(auth, googleProvider);
          analytics.authSignIn("google");
        } catch (err) {
          const code = (err as { code?: string }).code ?? "";
          // Popup blocked, unsupported, or storage-restricted → fall back to a
          // full-page redirect, which works without a popup relay.
          if (
            code === "auth/popup-blocked" ||
            code === "auth/cancelled-popup-request" ||
            code === "auth/operation-not-supported-in-this-environment" ||
            code === "auth/web-storage-unsupported"
          ) {
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          // Genuine failure (e.g. user closed the popup) — surface it so the
          // button doesn't stay stuck on "Signing in…".
          setAuthError(friendlyAuthError(err));
          throw err;
        }
      },
      signOut: async () => {
        analytics.authSignOut();
        await fbSignOut(auth);
      },
      deleteAccount: async () => {
        const current = auth.currentUser;
        if (!current) throw new Error("You're not signed in.");
        // Best-effort Firestore wipe before removing the auth record (rules are
        // keyed on the UID, so the wipe must happen while still authenticated).
        try {
          await deleteAllUserData(current.uid);
        } catch {
          // continue — auth-level delete is the required step
        }
        await deleteUser(current);
      },
    }),
    [user, initialized, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
