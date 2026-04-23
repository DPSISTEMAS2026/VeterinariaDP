import Link from "next/link";
import Image from "next/image";
import {
  Stethoscope, MessageSquare, ClipboardList, Package, Shield, Zap, ArrowRight, CheckCircle2,
  Clock, BarChart3, Smartphone, Users, CreditCard, Building2, ShoppingCart, UserCog, Layers,
  TrendingUp, HeartPulse, Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="DP Sistemas" width={160} height={45} priority />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#modulos" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Módulos</a>
            <a href="#ventajas" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Ventajas</a>
            <a href="#flujo" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Cómo Funciona</a>
            <a href="#planes" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Planes</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Iniciar Sesión</Button></Link>
            <Link href="/login"><Button size="sm">Ver Demo <ArrowRight className="w-4 h-4" /></Button></Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-accent-100 rounded-full blur-3xl opacity-30" />
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-brand-100">
                <Zap className="w-4 h-4" />
                Plataforma Todo-en-Uno para Veterinarias
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                Un solo sistema.{" "}
                <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
                  Toda tu clínica.
                </span>
              </h1>
              <p className="text-lg text-slate-600 mb-4 leading-relaxed">
                Clínica, inventario, punto de venta, CRM de clientes, gestión de personal y contabilidad.
                <strong className="text-slate-900"> Deja de pagar 3 o 4 plataformas distintas</strong> — con DP Sistemas tienes todo en un solo lugar, con una sola mantención.
              </p>
              <ul className="space-y-2 mb-8 text-sm text-slate-600">
                {["Fichas clínicas + Triage IA con 148 síntomas", "POS retail con imágenes de productos", "CRM de clientes y propietarios", "Gestión de personal y roles", "Inventario inteligente con alertas"].map(t => (
                  <li key={t} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />{t}</li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Link href="/login"><Button size="lg">Probar Demo Interactiva <ArrowRight className="w-5 h-5" /></Button></Link>
                <a href="#planes"><Button variant="outline" size="lg">Ver Planes</Button></a>
              </div>
              <p className="mt-4 text-sm text-slate-400">Implementación asistida · Precios accesibles · Soporte incluido</p>
            </div>
            <div className="relative animate-fade-in flex justify-center" style={{ animationDelay: "0.3s" }}>
              <div className="relative">
                <Image src="/dp-bot.png" alt="Mascota DP Sistemas" width={420} height={420} className="drop-shadow-2xl" priority />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-slate-100 px-6 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                    <HeartPulse className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Asistente Inteligente</p>
                    <p className="text-sm font-bold text-slate-900">Triage · Citas · Consultas 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMA / SOLUCIÓN */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6">¿Cuántas plataformas estás pagando hoy?</h2>
              <div className="space-y-4">
                {[
                  { old: "Software clínico", price: "$30.000 - $80.000/mes" },
                  { old: "Sistema de ventas / POS", price: "$15.000 - $40.000/mes" },
                  { old: "CRM de clientes", price: "$20.000 - $50.000/mes" },
                  { old: "Control de inventario", price: "$10.000 - $30.000/mes" },
                  { old: "Gestión de personal", price: "$15.000 - $35.000/mes" },
                ].map(i => (
                  <div key={i.old} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-300 line-through text-sm">{i.old}</span>
                    <span className="text-red-400 text-sm font-medium">{i.price}</span>
                  </div>
                ))}
                <div className="border-t border-white/20 pt-4 flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Total mensual estimado</span>
                  <span className="text-red-400 text-xl font-bold">$90.000 - $235.000</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <Image src="/logo-icon.png" alt="DP Sistemas" width={64} height={64} className="mb-6 drop-shadow-lg" />
              <h3 className="text-2xl font-bold mb-2">Todo incluido desde</h3>
              <div className="mb-4">
                <span className="text-5xl font-extrabold">$49.990</span>
                <span className="text-brand-200 text-lg"> CLP/mes</span>
              </div>
              <ul className="space-y-2 text-sm text-brand-100">
                {["Una sola plataforma", "Una sola mantención", "Un solo soporte", "Implementación incluida", "Actualizaciones gratuitas"].map(t => (
                  <li key={t} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-white" />{t}</li>
                ))}
              </ul>
              <Link href="/login" className="block mt-6">
                <Button size="lg" className="w-full bg-white text-brand-700 hover:bg-brand-50 shadow-xl">
                  Solicitar Demo <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MÓDULOS */}
      <section id="modulos" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">8 módulos en una sola plataforma</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Cada área de tu clínica cubierta. Sin integraciones externas, sin datos fragmentados.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
            {[
              { icon: <Stethoscope className="w-6 h-6" />, title: "Clínica Veterinaria", desc: "Transformamos la atención clínica. Fichas 100% digitales, motor de triage con IA para 148 síntomas y diagnósticos ultra-precisos.", color: "from-brand-500 to-cyan-500" },
              { icon: <ShoppingCart className="w-6 h-6" />, title: "Punto de Venta (POS)", desc: "Acelera tus ventas con un POS visual e intuitivo. Facturación rápida, control de caja impecable y soporte multi-pago en segundos.", color: "from-emerald-500 to-green-500" },
              { icon: <Package className="w-6 h-6" />, title: "Inventario Inteligente", desc: "El fin de las fugas de stock. Control en tiempo real, alertas predictivas de escasez y gestión avanzada de categorías médicas.", color: "from-amber-500 to-orange-500" },
              { icon: <Users className="w-6 h-6" />, title: "CRM & Fidelización", desc: "Construye relaciones para toda la vida. Perfiles 360° de pacientes, historial de hábitos y herramientas de retención que impulsan tu rentabilidad.", color: "from-violet-500 to-purple-500" },
              { icon: <UserCog className="w-6 h-6" />, title: "Control de Personal", desc: "Empodera a tu equipo de forma segura. Accesos basados en roles estrictos (Admin, Vet, Recepción) para blindar tu información confidencial.", color: "from-pink-500 to-rose-500" },
              { icon: <MessageSquare className="w-6 h-6" />, title: "Asistente IA 24/7", desc: "Tu recepcionista infatigable. Automatiza el triage por WhatsApp, capta pacientes fuera de horario y agenda citas sin esfuerzo humano.", color: "from-blue-500 to-indigo-500" },
              { icon: <BarChart3 className="w-6 h-6" />, title: "Dashboard Financiero", desc: "Domina tus números sin ser contador. KPIs de ingresos en tiempo real, análisis de tendencias y reportes gerenciales a un clic de distancia.", color: "from-teal-500 to-emerald-500" },
              { icon: <Banknote className="w-6 h-6" />, title: "Facturación Integrada", desc: "Despídete del caos administrativo. Emisión de boletas automáticas, cuadratura de caja diaria y conciliación financiera sin estrés.", color: "from-slate-600 to-slate-800" },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VENTAJAS */}
      <section id="ventajas" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">¿Por qué una sola plataforma?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Menos herramientas, menos costos, menos problemas. Más tiempo para lo que importa: tus pacientes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Layers className="w-8 h-8" />, title: "Todo Integrado", desc: "Clínica, ventas, inventario, CRM y RRHH en un solo lugar. Los datos fluyen entre módulos sin duplicar información ni pagar integraciones.", color: "brand" },
              { icon: <CreditCard className="w-8 h-8" />, title: "Un Solo Costo", desc: "En vez de pagar 4 o 5 suscripciones mensuales a distintos proveedores, pagas una sola mantención con soporte centralizado.", color: "emerald" },
              { icon: <TrendingUp className="w-8 h-8" />, title: "Crece Contigo", desc: "Desde una clínica pequeña hasta una red de sucursales. Agrega módulos y usuarios según crezcas, sin migrar datos.", color: "violet" },
            ].map(v => (
              <div key={v.title} className="text-center p-8 rounded-2xl border border-slate-100 hover:border-brand-200 hover:shadow-lg transition-all">
                <div className={`w-16 h-16 rounded-2xl bg-${v.color}-50 flex items-center justify-center text-${v.color}-600 mx-auto mb-5`}>
                  {v.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{v.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FLUJO */}
      <section id="flujo" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Flujo de atención completo</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Desde el primer contacto hasta el cobro y seguimiento. Todo trazable.</p>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            {[
              { step: "01", icon: <MessageSquare className="w-6 h-6" />, title: "Contacto", desc: "WhatsApp, teléfono o presencial. El chatbot hace triage automático con IA." },
              { step: "02", icon: <ClipboardList className="w-6 h-6" />, title: "Registro", desc: "Recepción registra paciente nuevo o busca existente. Ficha pre-llenada." },
              { step: "03", icon: <Stethoscope className="w-6 h-6" />, title: "Atención", desc: "El doctor atiende con ficha completa, síntomas y sugerencias de diagnóstico." },
              { step: "04", icon: <CreditCard className="w-6 h-6" />, title: "Cobro", desc: "Recepción cobra con efectivo, tarjeta o transferencia. Boleta imprimible." },
              { step: "05", icon: <Shield className="w-6 h-6" />, title: "Seguimiento", desc: "Receta digital, próximas citas, y el dueño recibe resumen de la visita." },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < 4 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-brand-200 to-transparent" />}
                <div className="w-16 h-16 rounded-2xl bg-brand-50 border-2 border-brand-100 flex items-center justify-center text-brand-600 mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-brand-500 mb-2">PASO {item.step}</div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Precios de implementación accesibles</h2>
            <p className="text-lg text-slate-600">Una inversión, no un gasto. Recupera el costo en el primer mes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Esencial", price: "29.990", desc: "Para clínicas que inician su digitalización", features: ["Hasta 3 usuarios", "Fichas clínicas digitales", "Cola de espera", "Inventario básico", "Chatbot web", "Soporte por email"], popular: false, cta: "Comenzar" },
              { name: "Profesional", price: "59.990", desc: "Todo lo que necesitas en una sola plataforma", features: ["Hasta 10 usuarios", "Todo lo de Esencial", "POS con imágenes", "CRM de clientes", "Chatbot WhatsApp + IA", "Triage con 148 síntomas", "Reportes avanzados", "Gestión de personal"], popular: true, cta: "Solicitar Demo" },
              { name: "Enterprise", price: "Cotizar", desc: "Para redes de clínicas con necesidades avanzadas", features: ["Usuarios ilimitados", "Todo lo de Profesional", "Multi-sucursal", "API de integración", "Facturación electrónica", "RRHH completo", "Personalización total", "Soporte prioritario 24/7"], popular: false, cta: "Contactar Ventas" },
            ].map(plan => (
              <div key={plan.name} className={`rounded-2xl p-8 border-2 transition-all duration-300 ${plan.popular ? "bg-white border-brand-500 shadow-xl shadow-brand-500/10 scale-105 relative" : "bg-white border-slate-200 hover:border-brand-200 hover:shadow-lg"}`}>
                {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">RECOMENDADO</div>}
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">{plan.desc}</p>
                <div className="mb-6">
                  {plan.price === "Cotizar" ? (
                    <span className="text-3xl font-extrabold text-slate-900">A medida</span>
                  ) : (
                    <><span className="text-4xl font-extrabold text-slate-900">${plan.price}</span><span className="text-slate-500 text-sm"> CLP/mes</span></>
                  )}
                </div>
                <Link href="/login"><Button variant={plan.popular ? "primary" : "outline"} className="w-full mb-6">{plan.cta}</Button></Link>
                <ul className="space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <Image src="/logo-icon.png" alt="DP Sistemas" width={80} height={80} className="mx-auto mb-6 drop-shadow-xl" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Deja de pagar por separado lo que puede estar en un solo sistema
              </h2>
              <p className="text-brand-100 text-lg mb-8 max-w-xl mx-auto">
                Clínica + POS + CRM + Inventario + RRHH. Una plataforma, una mantención, un equipo de soporte.
              </p>
              <Link href="/login">
                <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50 shadow-xl">
                  Solicitar Demo Gratuita <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image src="/logo-full.png" alt="DP Sistemas" width={140} height={60} className="brightness-0 invert" />
            </div>
            <div className="flex items-center gap-8 text-sm">
              <a href="#modulos" className="hover:text-white transition-colors">Módulos</a>
              <a href="#ventajas" className="hover:text-white transition-colors">Ventajas</a>
              <a href="#planes" className="hover:text-white transition-colors">Planes</a>
            </div>
            <p className="text-sm">© 2026 DP Sistemas · Hecho en Chile 🇨🇱</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
