"use client";

import { ReactNode } from "react";

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button type="button" aria-label="Fechar painel" className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-surface px-4 pt-3 shadow-soft pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="h-11 rounded-lg px-3 text-sm font-semibold">
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
