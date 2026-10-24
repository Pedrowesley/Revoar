import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const WIDTHS = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

export function PageShell({ children, width = "lg", className }: PageShellProps) {
  return (
    <div className={cn("mx-auto animate-fade-up px-4 py-8 sm:py-10", WIDTHS[width], className)}>
      {children}
    </div>
  );
}
