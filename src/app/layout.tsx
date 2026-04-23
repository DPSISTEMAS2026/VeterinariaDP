import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { DemoProvider } from "@/lib/demo-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DP Sistemas — Gestión de Veterinarias",
  description:
    "Plataforma de gestión inteligente para clínicas veterinarias. Triage automático, fichas digitales, inventario y chatbot integrado.",
  keywords: ["veterinaria", "gestión", "mascotas", "triage", "chatbot", "fichas médicas", "DP Sistemas"],
  openGraph: {
    title: "DP Sistemas — Gestión de Veterinarias",
    description: "Acelera la atención, automatiza el triage y digitaliza tu clínica veterinaria.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <DemoProvider>
            {children}
          </DemoProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
