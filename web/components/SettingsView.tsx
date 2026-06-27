"use client";

import { useState } from "react";
import { ChevronRight, ExternalLink, Info, ShieldCheck } from "lucide-react";
import { ScreenHeader } from "./ScreenHeader";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "./ThemeProvider";
import { Button, Segmented, Select } from "./controls";
import { ConfirmDialog } from "./ConfirmDialog";
import { AboutSheet } from "./AboutSheet";
import {
  SettingsSection,
  SettingsRow,
  SettingsToggle,
  SettingsDivider,
  SettingsLinkRow,
} from "./settings";
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
      <ScreenHeader title="Settings" onBack={onClose} />

      <div className="no-scrollbar mx-auto w-full max-w-xl flex-1 overflow-y-auto px-4 py-4">
        {/* Profile */}
        <SettingsSection>
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
        </SettingsSection>

        {/* Currency */}
        <SettingsSection>
          <SettingsRow label="Currency">
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
          </SettingsRow>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection title="Appearance">
          <div className="mt-2">
            <Segmented
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
              selected={appearance}
              onSelect={(m) => {
                setAppearance(m as Appearance);
                analytics.settingThemeChange(m as Appearance);
              }}
            />
          </div>
          <SettingsDivider />
          <SettingsToggle
            label="Rounded font"
            sub="Use the brand rounded font everywhere"
            checked={useRoundedFont}
            onChange={(v) => {
              setUseRoundedFont(v);
              analytics.settingFontChange(v ? "rounded" : "system");
            }}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          <SettingsRow label="Reminder time">
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
          </SettingsRow>
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
        </SettingsSection>

        {/* Haptics */}
        <SettingsSection>
          <SettingsToggle
            label="Haptic feedback"
            sub="Subtle vibration on actions"
            checked={haptics}
            onChange={(v) => {
              setHaptics(v);
              prefs.setHaptics(v);
              analytics.settingHapticsToggle(v);
              if (v) haptic();
            }}
          />
        </SettingsSection>

        {/* Legal & info */}
        <SettingsSection title="Legal & info">
          <SettingsLinkRow
            icon={<ShieldCheck size={18} />}
            label="Privacy Policy"
            href={PRIVACY_URL}
            trailing={
              <ExternalLink size={14} className="text-on-surface-variant" />
            }
          />
          <SettingsDivider />
          <SettingsLinkRow
            icon={<Info size={18} />}
            label="About Varisankya"
            onClick={() => {
              setShowAbout(true);
              analytics.screenAboutOpen();
            }}
            trailing={
              <ChevronRight size={16} className="text-on-surface-variant" />
            }
          />
        </SettingsSection>

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

      <AboutSheet
        open={showAbout}
        onClose={() => setShowAbout(false)}
        appName="Varisankya"
        iconSrc="/icons/icon-512.png"
        description="A simple, private tracker for your subscriptions and recurring payments. Your data syncs securely across Android, iOS, and the web."
      />

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
