"use client";

import { IndianRupee } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SignIn } from "@/components/SignIn";
import { App } from "@/components/App";

const configMissing = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export default function Home() {
  const { user, initialized } = useAuth();

  if (configMissing) return <ConfigNotice />;
  if (!initialized) return <Splash />;
  if (!user) return <SignIn />;
  return <App />;
}

function Splash() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-3xl bg-primary text-on-primary">
        <IndianRupee size={48} />
      </div>
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
