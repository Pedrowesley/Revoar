"use client";

import { ReactNode } from "react";

type BottomBarProps = {
  eyebrow?: ReactNode;
  price?: string;
  action: string;
  onAction?: () => void;
  form?: string;
  disabled?: boolean;
  type?: "button" | "submit";
};

export function BottomBar({ eyebrow, price, action, onAction, form, disabled, type = "button" }: BottomBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-4 pt-3 shadow-soft lg:static lg:z-auto lg:mt-4 lg:rounded-2xl lg:border lg:shadow-none pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-lg items-center gap-3 lg:max-w-none">
        {(eyebrow || price) && (
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="truncate text-xs text-muted-foreground">{eyebrow}</p>}
            {price && <p className="truncate text-base font-bold">{price}</p>}
          </div>
        )}
        <button
          type={type}
          form={form}
          disabled={disabled}
          onClick={onAction}
          className="h-12 min-w-[9.5rem] shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:text-base"
        >
          {action}
        </button>
      </div>
    </div>
  );
}
