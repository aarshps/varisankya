"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "outline";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none";
  const styles: Record<string, string> = {
    primary: "bg-primary text-on-primary hover:opacity-90",
    outline:
      "border border-outline text-on-surface hover:bg-black/5 dark:hover:bg-white/10",
    ghost:
      "text-on-surface hover:bg-black/5 dark:hover:bg-white/10",
    danger:
      "border border-outline text-red-500 hover:bg-red-500/10",
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40 ${
        checked ? "bg-primary" : "bg-outline"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-outline bg-surface-2 px-4 py-3 text-base text-on-surface outline-none transition focus:border-on-surface";

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    children: ReactNode;
  },
) {
  return (
    <select {...props} className={`${inputClass} ${props.className ?? ""}`}>
      {props.children}
    </select>
  );
}
