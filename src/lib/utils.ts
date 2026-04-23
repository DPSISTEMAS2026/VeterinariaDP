import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getUrgencyColor(urgency: string) {
  const colors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    critica: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
    alta: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
    media: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500" },
    baja: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  };
  return colors[urgency] || colors.baja;
}

export function getStatusConfig(status: string) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    en_espera: { label: "En Espera", color: "text-amber-700", bg: "bg-amber-50" },
    en_atencion: { label: "En Atención", color: "text-blue-700", bg: "bg-blue-50" },
    atendida: { label: "Atendida", color: "text-purple-700", bg: "bg-purple-50" },
    completada: { label: "Completada", color: "text-emerald-700", bg: "bg-emerald-50" },
    cancelada: { label: "Cancelada", color: "text-gray-700", bg: "bg-gray-100" },
  };
  return config[status] || config.en_espera;
}
