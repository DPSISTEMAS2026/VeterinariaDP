import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "w-full rounded-xl border-2 border-border-light bg-surface px-4 py-2.5 text-sm text-foreground",
              "placeholder:text-slate-400",
              "transition-all duration-200",
              "focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
              "hover:border-slate-300",
              icon && "pl-11",
              error && "border-red-300 focus:border-red-400 focus:ring-red-100",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
