import { cn } from "@/lib/utils";

type SurfaceProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  interactive?: boolean;
};

export function Surface({ children, className, as: Tag = "div", interactive }: SurfaceProps) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-border/80 bg-surface shadow-soft",
        interactive && "transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lift",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
