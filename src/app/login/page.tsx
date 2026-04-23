"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Send, X, CheckCircle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemoModal, setShowDemoModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await signIn(email, password);
    if (err) {
      setError("Credenciales incorrectas. Verifica e intenta nuevamente.");
    } else {
      router.push("/dashboard");
      return;
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f0fdfa 0%, #ecfeff 25%, #f0f9ff 50%, #faf5ff 75%, #fdf2f8 100%)" }}>
      {/* Decorative orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-brand-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-accent-200/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-100/20 rounded-full blur-3xl" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[440px] mx-4 animate-slide-up">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-900/10 border border-white/60 p-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image src="/logo-full.png" alt="DP Sistemas" width={200} height={80} priority />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Bienvenido</h1>
            <p className="text-slate-500 text-sm">Ingresa tus credenciales para acceder</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              label="Correo Electrónico"
              type="email"
              placeholder="tu@clinica.cl"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                id="password"
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : (
                <>Iniciar Sesión <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="px-4 text-xs text-slate-400">o</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Demo CTA */}
          <button
            onClick={() => setShowDemoModal(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Solicitar una Demo Gratuita
          </button>

          <p className="mt-6 text-xs text-slate-400 text-center">
            ¿No tienes cuenta? Contacta a tu administrador.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 DP Sistemas · Hecho en Chile 🇨🇱
        </p>
      </div>

      {/* DEMO MODAL */}
      {showDemoModal && <DemoRequestModal onClose={() => setShowDemoModal(false)} />}
    </div>
  );
}

function DemoRequestModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", clinic_name: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setSending(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: dbError } = await supabase.from("demo_requests").insert({
        name: form.name, email: form.email, phone: form.phone || null,
        clinic_name: form.clinic_name || null, message: form.message || null,
      });
      if (dbError) throw new Error(dbError.message);
      setSent(true);
    } catch {
      setError("Error al enviar. Escríbenos a contacto@dpsistemas.cl");
    }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in overflow-hidden">
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div><h3 className="text-lg font-bold">Solicitar Demo</h3><p className="text-white/80 text-sm mt-1">Te contactaremos con acceso al sistema completo</p></div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
        </div>
        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">¡Solicitud Enviada!</h4>
            <p className="text-slate-500 text-sm mb-6">Te contactaremos a <strong>{form.email}</strong> con las credenciales de acceso.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all cursor-pointer">Entendido</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre" className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tu@clinica.cl" className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+56 9 1234 5678" className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Clínica</label><input value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} placeholder="Nombre de tu clínica" className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all" /></div>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">✕ {error}</p>}
            <button type="submit" disabled={sending || !form.name || !form.email} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all shadow-lg disabled:opacity-50 cursor-pointer">
              {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : <><Send className="w-4 h-4" />Enviar Solicitud</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
