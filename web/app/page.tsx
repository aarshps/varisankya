"use client";

import { useAuth } from "@/hooks/useAuth";
import { SignIn } from "@/components/SignIn";
import { App } from "@/components/App";

const configMissing = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export default function Home() {
  const { user, initialized, signInWithGoogle, authError } = useAuth();

  if (configMissing) return <ConfigNotice />;
  if (!initialized) return <Splash />;
  if (!user)
    return (
      <SignIn
        appName="Varisankya"
        tagline="Track your subscriptions and recurring payments — synced across all your devices."
        iconSrc="/icons/icon-512.png"
        onSignIn={signInWithGoogle}
        externalError={authError}
      />
    );
  return <App />;
}

function Splash() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/icon-512.png"
        alt="Varisankya"
        width={96}
        height={96}
        className="h-24 w-24 animate-pulse rounded-3xl"
      />
      <p className="text-2xl font-extrabold">Varisankya</p>
    </main>
  );
}

function ConfigNotice() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="card max-w-md p-8 text-center">
        <h1 className="text-xl font-extrabold">Firebase config missing</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          Set the <code>NEXT_PUBLIC_FIREBASE_*</code> environment variables in{" "}
          <code>.env.local</code> (locally) or in the Vercel project settings.
          Copy the config from Firebase Console → Project settings → Web app for
          project <strong>helloworld-92567418</strong>. See{" "}
          <code>.env.example</code>.
        </p>
      </div>
    </main>
  );
}
