import { cn } from "@/lib/utils";

type AlertProps = {
  variant?: "info" | "warning" | "danger" | "success";
  title?: string;
  children: React.ReactNode;
  className?: string;
};

const STYLES = {
  info: "border-blue-200 bg-info-soft text-blue-950",
  warning: "border-amber-200 bg-warning-soft text-amber-950",
  danger: "border-red-200 bg-danger-soft text-red-950",
  success: "border-green-200 bg-success-soft text-green-950",
};

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", STYLES[variant], className)}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
