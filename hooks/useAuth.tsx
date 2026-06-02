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
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth, firebaseReady, googleProvider } from "@/lib/firebase";
import { deleteAllUserData } from "@/lib/firestore";

interface AuthContextValue {
  user: User | null;
  initialized: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Without SDK config there is nothing to listen to; mark initialized so the
    // UI can show the config notice instead of hanging on the splash.
    if (!firebaseReady) {
      setInitialized(true);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitialized(true);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initialized,
      signInWithGoogle: async () => {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (err) {
          // Popup blocked / closed → fall back to redirect.
          const code = (err as { code?: string }).code ?? "";
          if (
            code === "auth/popup-blocked" ||
            code === "auth/cancelled-popup-request" ||
            code === "auth/operation-not-supported-in-this-environment"
          ) {
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          throw err;
        }
      },
      signOut: () => fbSignOut(auth),
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
    [user, initialized],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
