"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Bottom-sheet style on mobile (32dp top corners + drag handle), centered card on desktop. */
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="sheet relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden sm:m-4 sm:max-w-lg sm:rounded-[28px]">
        {/* M3 bottom-sheet drag handle (mobile only) */}
        <div className="flex shrink-0 justify-center pt-3 sm:hidden">
          <span className="h-1 w-9 rounded-full bg-outline-strong/40" />
        </div>
        <div className="flex shrink-0 items-center justify-between px-5 pt-2 pb-2 sm:pt-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-on-surface-variant transition hover:bg-on-surface/10"
          >
            <X size={20} />
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-5">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-outline/60 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
