"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Info,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "./ThemeProvider";
import { Button, Select, Switch } from "./ui/controls";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { AboutDialog } from "./AboutDialog";
import { CURRENCIES } from "@/lib/currency";
import { PRIVACY_URL } from "@/lib/constants";
import { prefs, haptic, type Appearance } from "@/lib/prefs";
import { analytics } from "@/lib/analytics";

export function SettingsView({
  currency,
  onCurrencyChange,
  onClose,
}: {
  currency: string;
  onCurrencyChange: (code: string) => void;
  onClose: () => void;
}) {
  const { user, signOut, deleteAccount } = useAuth();
  const { appearance, setAppearance, useRoundedFont, setUseRoundedFont } =
    useTheme();

  const [haptics, setHaptics] = useState(prefs.getHaptics());
  const [notifDays, setNotifDays] = useState(prefs.getNotificationDays());
  const [notifHour, setNotifHour] = useState(prefs.getNotificationHour());
  const [notifMinute, setNotifMinute] = useState(prefs.getNotificationMinute());

  const [showSignOut, setShowSignOut] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const timeValue = `${String(notifHour).padStart(2, "0")}:${String(
    notifMinute,
  ).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-bg px-4 py-3">
        <button
          onClick={onClose}
          aria-label="Back"
          className="rounded-full p-2 transition hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold">Settings</h1>
      </header>

      <div className="no-scrollbar mx-auto w-full max-w-xl flex-1 overflow-y-auto px-4 py-4">
        {/* Profile */}
        <Card>
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt=""
                width={52}
                height={52}
                className="rounded-full"
                unoptimized
              />
            ) : (
              <div className="h-13 w-13 rounded-full bg-surface-2" />
            )}
            <div className="min-w-0">
              <p className="truncate font-bold">
                {user?.displayName ?? "Signed in"}
              </p>
              <p className="truncate text-sm text-on-surface-variant">
                {user?.email ?? ""}
              </p>
            </div>
          </div>
        </Card>

        {/* Currency */}
        <Card>
          <Row label="Currency">
            <Select
              value={currency}
              onChange={(e) => {
                onCurrencyChange(e.target.value);
                prefs.setCurrency(e.target.value);
                analytics.settingCurrencyChange(e.target.value);
              }}
              className="w-40"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} {c.symbol}
                </option>
              ))}
            </Select>
          </Row>
        </Card>

        {/* Appearance */}
        <Card>
          <SectionLabel>Appearance</SectionLabel>
          <div className="mt-2 flex rounded-full bg-surface-2 p-1">
            {(["system", "light", "dark"] as Appearance[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setAppearance(m);
                  analytics.settingThemeChange(m);
                }}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold capitalize transition ${
                  appearance === m
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <Divider />
          <Row
            label="Rounded font"
            sub="Use the brand rounded font everywhere"
          >
            <Switch
              checked={useRoundedFont}
              onChange={(v) => {
                setUseRoundedFont(v);
                analytics.settingFontChange(v ? "rounded" : "system");
              }}
            />
          </Row>
        </Card>

        {/* Notifications */}
        <Card>
          <SectionLabel>Notifications</SectionLabel>
          <Row label="Reminder time">
            <input
              type="time"
              value={timeValue}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                setNotifHour(h);
                setNotifMinute(m);
                prefs.setNotificationTime(h, m);
                analytics.settingNotificationTimeChange();
              }}
              className="rounded-xl border border-outline bg-surface-2 px-3 py-2"
            />
          </Row>
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-on-surface-variant">
                Days before due
              </span>
              <span className="text-sm font-semibold">{notifDays} days</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={notifDays}
              onChange={(e) => {
                const v = Number(e.target.value);
                setNotifDays(v);
                prefs.setNotificationDays(v);
                analytics.settingNotificationDaysChange(v);
              }}
              className="mt-2 w-full accent-[var(--primary)]"
            />
          </div>
          <p className="mt-2 text-xs text-on-surface-variant">
            Reminder delivery on web is coming soon — your preference is saved.
          </p>
        </Card>

        {/* Haptics */}
        <Card>
          <Row label="Haptic feedback" sub="Subtle vibration on actions">
            <Switch
              checked={haptics}
              onChange={(v) => {
                setHaptics(v);
                prefs.setHaptics(v);
                analytics.settingHapticsToggle(v);
                if (v) haptic();
              }}
            />
          </Row>
        </Card>

        {/* Legal & info */}
        <Card>
          <SectionLabel>Legal &amp; info</SectionLabel>
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-3 font-medium"
          >
            <ShieldCheck size={18} />
            Privacy Policy
            <ExternalLink size={14} className="ml-auto text-on-surface-variant" />
          </a>
          <Divider />
          <button
            onClick={() => {
              setShowAbout(true);
              analytics.screenAboutOpen();
            }}
            className="flex w-full items-center gap-3 py-3 font-medium"
          >
            <Info size={18} />
            About Varisankya
            <ChevronRight size={16} className="ml-auto text-on-surface-variant" />
          </button>
        </Card>

        <div className="mt-2 flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowSignOut(true)}
          >
            Sign out
          </Button>
          <Button
            variant="danger"
            className="w-full"
            onClick={() => setShowDelete(true)}
          >
            Delete account
          </Button>
          <p className="px-4 text-center text-xs text-on-surface-variant">
            Deleting your account removes all subscription and payment data
            permanently.
          </p>
          {deleteError && (
            <p className="text-center text-sm text-error">{deleteError}</p>
          )}
        </div>
      </div>

      <AboutDialog open={showAbout} onClose={() => setShowAbout(false)} />

      <ConfirmDialog
        open={showSignOut}
        title="Sign out of Varisankya?"
        message="You can sign back in any time with the same Google account."
        confirmLabel="Sign out"
        onConfirm={async () => {
          await signOut();
        }}
        onClose={() => setShowSignOut(false)}
      />

      <ConfirmDialog
        open={showDelete}
        danger
        busy={deleting}
        title="Permanently delete your account?"
        message="This removes your sign-in, every subscription, and every payment record. This cannot be undone."
        confirmLabel="Delete everything"
        onConfirm={async () => {
          setDeleting(true);
          setDeleteError(null);
          try {
            await deleteAccount();
          } catch (e) {
            setDeleteError(
              `Couldn't delete: ${(e as Error).message}. Sign out, sign back in, and try again.`,
            );
            setShowDelete(false);
          } finally {
            setDeleting(false);
          }
        }}
        onClose={() => setShowDelete(false)}
      />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card mb-3 p-4">{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
      {children}
    </p>
  );
}

function Row({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        {sub && <p className="text-xs text-on-surface-variant">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="my-2 h-px bg-outline/60" />;
}
