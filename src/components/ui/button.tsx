import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          "active:scale-[0.98]",
          {
            "bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/20 hover:shadow-lg hover:shadow-brand-600/30":
              variant === "primary",
            "bg-accent-500 text-white hover:bg-accent-600 shadow-md shadow-accent-500/20":
              variant === "secondary",
            "border-2 border-border-default text-foreground hover:bg-surface-secondary hover:border-brand-300":
              variant === "outline",
            "text-foreground hover:bg-surface-tertiary":
              variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20":
              variant === "danger",
          },
          {
            "text-sm px-3.5 py-2": size === "sm",
            "text-sm px-5 py-2.5": size === "md",
            "text-base px-7 py-3.5": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
