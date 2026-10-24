"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "danger" | "info";

type ToastItem = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastApi = {
  (input: ToastInput): void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const STYLES: Record<ToastVariant, string> = {
  success: "border-green-200 bg-success-soft text-green-950",
  danger: "border-red-200 bg-danger-soft text-red-950",
  info: "border-blue-200 bg-info-soft text-blue-950",
};

const ICONS = {
  success: Check,
  danger: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback((input: ToastInput) => {
    const item: ToastItem = {
      id: crypto.randomUUID(),
      variant: input.variant ?? "info",
      title: input.title,
      description: input.description,
    };
    setItems((current) => [...current, item].slice(-4));
    window.setTimeout(() => dismiss(item.id), 4800);
  }, [dismiss]);

  const api = useMemo(() => {
    const toast = ((input: ToastInput) => push(input)) as ToastApi;
    toast.success = (title, description) => push({ title, description, variant: "success" });
    toast.error = (title, description) => push({ title, description, variant: "danger" });
    toast.info = (title, description) => push({ title, description, variant: "info" });
    return toast;
  }, [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastList items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const api = useContext(ToastContext);
  if (!api) {
    throw new Error("useToast precisa do ToastProvider");
  }
  return api;
}

function ToastList({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (items.length === 0) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss(items[items.length - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, onDismiss]);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2"
    >
      {items.map((item) => {
        const Icon = ICONS[item.variant];
        return (
          <div
            key={item.id}
            role={item.variant === "danger" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex animate-fade-up items-start gap-3 rounded-xl border px-3.5 py-3 shadow-lift",
              STYLES[item.variant],
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-sm leading-relaxed opacity-90">{item.description}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="Fechar aviso"
              className="rounded-md p-1 opacity-70 transition hover:opacity-100"
              onClick={() => onDismiss(item.id)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
