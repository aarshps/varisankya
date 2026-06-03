"use client";

import { IndianRupee } from "lucide-react";
import { Modal } from "./ui/Modal";
import { APP_NAME } from "@/lib/constants";

export function AboutDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={`About ${APP_NAME}`}>
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-on-primary">
          <IndianRupee size={40} />
        </div>
        <div>
          <p className="text-xl font-extrabold">{APP_NAME}</p>
          <p className="text-sm text-on-surface-variant">Web</p>
        </div>
        <p className="max-w-xs text-sm text-on-surface-variant">
          A simple, private tracker for your subscriptions and recurring
          payments. Your data syncs securely across Android, iOS, and the web.
        </p>
      </div>
    </Modal>
  );
}
