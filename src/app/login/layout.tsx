import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión — DP Sistemas",
  description: "Ingresa a tu cuenta DP Sistemas para gestionar tu clínica veterinaria.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
