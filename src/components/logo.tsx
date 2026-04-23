import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  variant?: "light" | "dark";
}

const sizes = {
  sm: { img: 28, text: "text-base" },
  md: { img: 36, text: "text-lg" },
  lg: { img: 48, text: "text-xl" },
  xl: { img: 64, text: "text-2xl" },
};

export function Logo({ size = "md", showText = true, className, variant = "light" }: LogoProps) {
  const s = sizes[size];
  const textColor = variant === "dark" ? "text-white" : "text-slate-900";
  const subColor = variant === "dark" ? "text-slate-300" : "text-slate-500";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/logo-icon.png"
        alt="DP Sistemas"
        width={s.img}
        height={s.img}
        className="shrink-0"
        priority
      />
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn("font-bold", s.text, textColor)}>
            DP <span className="text-brand-600">Sistemas</span>
          </span>
          {(size === "lg" || size === "xl") && (
            <span className={cn("text-xs", subColor)}>Gestión de Veterinarias</span>
          )}
        </div>
      )}
    </div>
  );
}

export function LogoMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/logo-icon.png"
      alt="DP Sistemas"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      priority
    />
  );
}
