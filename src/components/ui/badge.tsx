import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "brand";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = "default", size = "sm", dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        {
          "text-xs px-2.5 py-0.5": size === "sm",
          "text-sm px-3 py-1": size === "md",
        },
        {
          "bg-slate-100 text-slate-700": variant === "default",
          "bg-emerald-50 text-emerald-700": variant === "success",
          "bg-amber-50 text-amber-700": variant === "warning",
          "bg-red-50 text-red-700": variant === "danger",
          "bg-blue-50 text-blue-700": variant === "info",
          "bg-brand-50 text-brand-700": variant === "brand",
        },
        className
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full", {
            "bg-slate-500": variant === "default",
            "bg-emerald-500": variant === "success",
            "bg-amber-500": variant === "warning",
            "bg-red-500": variant === "danger",
            "bg-blue-500": variant === "info",
            "bg-brand-500": variant === "brand",
          })}
        />
      )}
      {children}
    </span>
  );
}
