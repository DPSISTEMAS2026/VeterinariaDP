"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PawPrint,
  LayoutDashboard,
  Stethoscope,
  Package,
  LogOut,
  ChevronLeft,
  Bell,
  Search,
  Menu,
  ShieldAlert,
  BookOpen,
  UserCog,
  CreditCard,
  ClipboardList,
  ShoppingCart,
  MessageCircle,
  Mail,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Logo, LogoMark } from "@/components/logo";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-context";
import { ChatWidget } from "@/components/chat-widget";
import type { DemoStep } from "@/lib/demo-context";

const ALL_NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", id: "nav-dashboard", roles: ["owner","admin","veterinarian","receptionist","inventory"] },
  { href: "/dashboard/consultas", icon: Stethoscope, label: "Consultas", id: "nav-consultas", roles: ["owner","admin","veterinarian","receptionist"] },
  { href: "/dashboard/pacientes", icon: PawPrint, label: "Pacientes", id: "nav-pacientes", roles: ["owner","admin","veterinarian","receptionist"] },
  { href: "/dashboard/inventario", icon: Package, label: "Inventario", id: "nav-inventario", roles: ["owner","admin","veterinarian","inventory"] },
  { href: "/dashboard/pos", icon: ShoppingCart, label: "Punto de Venta", id: "nav-pos", roles: ["owner","admin","receptionist"] },
];

function getNavForRole(role: string) {
  return ALL_NAV.filter(n => n.roles.includes(role));
}

const ROLE_META: Record<string, { label: string; color: string; icon: any }> = {
  owner: { label: "Propietario", color: "bg-purple-100 text-purple-700 border-purple-200", icon: ShieldAlert },
  admin: { label: "Administrador", color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: UserCog },
  veterinarian: { label: "Veterinario", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Stethoscope },
  receptionist: { label: "Recepción / Caja", color: "bg-amber-100 text-amber-700 border-amber-200", icon: CreditCard },
  inventory: { label: "Inventario", color: "bg-cyan-100 text-cyan-700 border-cyan-200", icon: Package },
  viewer: { label: "Visor", color: "bg-slate-100 text-slate-700 border-slate-200", icon: ClipboardList },
};

/* ── TOUR STEPS POR ROL ── */

const TOUR_RECEPTIONIST: DemoStep[] = [
  { id: "welcome", target: "#sidebar-logo", title: "Panel de Recepcion", content: "Bienvenida al modulo de Recepcion/Caja. Desde aqui gestionas ingreso de pacientes, cobros, boletas/recetas y el Punto de Venta.", placement: "right" },
  { id: "go-dashboard", target: "#nav-dashboard", title: "Dashboard en Tiempo Real", content: "Tu dashboard muestra: cola de espera, consultas en atencion, consultas listas para cobrar y accesos rapidos.", placement: "right", navigate: "/dashboard" },
  { id: "go-consultas", target: "#nav-consultas", title: "Cola de Consultas", content: "Aqui aparecen los pacientes por 3 canales: Rocky (Presencial/EMERGENCIA), Michi (Llamada), Pelusa (WhatsApp/Chatbot).", placement: "right", navigate: "/dashboard/consultas", waitMs: 1000 },
  { id: "see-nueva", target: "#sidebar-logo", title: "Nueva Consulta", content: "El boton Nueva Consulta registra pacientes presenciales o por telefono. Se agrega a la cola y el doctor lo ve al instante.", placement: "right" },
  { id: "go-pacientes", target: "#nav-pacientes", title: "Fichas de Pacientes", content: "Todas las fichas con datos del dueno, especie, raza, peso y notas. Puedes registrar nuevos pacientes y buscar.", placement: "right", navigate: "/dashboard/pacientes", waitMs: 1000 },
  { id: "go-pos", target: "#nav-pos", title: "Punto de Venta (POS)", content: "Tu modulo de ventas! Vende alimentos, accesorios, caniles y productos de higiene. Selecciona productos, ajusta cantidades y cobra.", placement: "right", navigate: "/dashboard/pos", waitMs: 1000 },
  { id: "pos-detail", target: "#sidebar-logo", title: "Como Funciona el POS", content: "1. Click en productos para agregar al carrito\n2. Ajusta cantidades con +/-\n3. Selecciona metodo de pago\n4. Presiona Cobrar\n5. Imprime boleta", placement: "right" },
  { id: "back-consultas", target: "#nav-consultas", title: "Flujo de Cobro Medico", content: "Cuando el doctor finaliza, la consulta pasa a Por Cobrar. Cobras, imprimes boleta y receta medica.", placement: "right", navigate: "/dashboard/consultas", waitMs: 1000 },
  { id: "chatbot", target: "#sidebar-logo", title: "Chatbot DP Sistemas", content: "El asistente inteligente (esquina inferior derecha) atiende por web y WhatsApp. Hace triage automatico y agenda citas.", placement: "right" },
];

const TOUR_VETERINARIAN: DemoStep[] = [
  { id: "welcome", target: "#sidebar-logo", title: "Panel del Veterinario", content: "Bienvenido al modulo clinico. Aqui atiendes pacientes con herramientas de diagnostico inteligente y recetas automatizadas.", placement: "right" },
  { id: "go-dashboard", target: "#nav-dashboard", title: "Tu Dashboard", content: "Vista rapida de pacientes en espera, emergencias prioritarias y consultas activas.", placement: "right", navigate: "/dashboard" },
  { id: "go-consultas", target: "#nav-consultas", title: "Cola de Espera", content: "Aqui ves los pacientes esperando. Rocky aparece primero con alerta roja: es una emergencia real (posible fractura). El sistema prioriza automaticamente por urgencia.", placement: "right", navigate: "/dashboard/consultas", waitMs: 1200 },
  { id: "explain-atender", target: "#sidebar-logo", title: "Boton Atender", content: "Al presionar Atender en cualquier paciente, se cambia su estado a En Atencion y se abre la pagina clinica completa. Al presionar Siguiente atenderemos al primer paciente.", placement: "right" },
  { id: "click-atender", target: "#sidebar-logo", title: "Ficha de Atencion", content: "Estamos dentro de la ficha clinica. Arriba ves los datos del paciente, propietario, especie, raza y motivo de consulta. Tambien el campo de peso para registrar el peso actual.", placement: "right", click: "[data-tour='atender']", waitMs: 2500 },
  { id: "show-symptoms", target: "#sidebar-logo", title: "Sintomas del Paciente", content: "Los sintomas se extraen automaticamente del motivo de consulta. Puedes agregar mas con autocompletado. Cada vez que modificas los sintomas, el motor de triage recalcula los diagnosticos.", placement: "right", scroll: "[data-tour='symptoms']", waitMs: 800 },
  { id: "show-diagnosis", target: "#sidebar-logo", title: "Diagnosticos Sugeridos", content: "El motor de triage analizo los sintomas y sugiere diagnosticos con porcentaje de coincidencia, severidad y urgencia. Ahora seleccionaremos el primer diagnostico automaticamente.", placement: "right", scroll: "[data-tour='diagnosis']", waitMs: 800 },
  { id: "click-diagnosis", target: "#sidebar-logo", title: "Diagnostico Seleccionado!", content: "Al seleccionar un diagnostico ocurre la magia:\n- Se auto-llena el tratamiento con protocolo clinico\n- Se cargan medicamentos recomendados del inventario real\n- Se abren las secciones de medicamentos y tratamiento", placement: "right", click: "[data-tour='first-diagnosis']", waitMs: 1500 },
  { id: "show-meds", target: "#sidebar-logo", title: "Medicamentos Recomendados", content: "Mira! Los medicamentos se cargaron automaticamente del inventario real. Los marcados como RECOMENDADO coinciden con el diagnostico. Puedes agregar, quitar y escribir dosis e indicaciones.", placement: "right", scroll: "[data-tour='medications']", waitMs: 800 },
  { id: "show-treatment", target: "#sidebar-logo", title: "Tratamiento Auto-generado", content: "El tratamiento se lleno automaticamente con el protocolo clinico del diagnostico seleccionado. Puedes editarlo libremente y agregar observaciones adicionales.", placement: "right", scroll: "[data-tour='treatment']", waitMs: 800 },
  { id: "show-finalize", target: "#sidebar-logo", title: "Finalizar y Enviar a Cobro", content: "Al presionar este boton:\n1. Se guarda diagnostico, tratamiento y receta\n2. La consulta pasa a estado Por Cobrar\n3. Recepcion la ve instantaneamente para cobrar\n4. Se puede imprimir boleta y receta medica", placement: "right", scroll: "[data-tour='finalize']", waitMs: 800 },
];

const TOUR_INVENTORY: DemoStep[] = [
  { id: "welcome", target: "#sidebar-logo", title: "Panel de Inventario", content: "Bienvenido al modulo de inventario. Controla todo el stock de medicamentos, insumos, vacunas y productos retail.", placement: "right" },
  { id: "go-dashboard", target: "#nav-dashboard", title: "Dashboard", content: "Resumen rapido con total de productos, alertas de stock bajo, y metricas de la clinica.", placement: "right", navigate: "/dashboard" },
  { id: "go-inventario", target: "#nav-inventario", title: "Tabla de Inventario", content: "Vista tipo Excel! Ordena por columna, filtra por categoria, proveedor o estado de stock. Ajusta cantidades con +/- y registra nuevos productos.", placement: "right", navigate: "/dashboard/inventario", waitMs: 1000 },
  { id: "flow-filters", target: "#sidebar-logo", title: "Filtros Inteligentes", content: "Busca por nombre, SKU o proveedor. Filtra por categoria (26 disponibles), proveedor, o estado (Disponibles, Stock Bajo, Agotados). Ordena cualquier columna.", placement: "right" },
  { id: "flow-alerts", target: "#sidebar-logo", title: "Alertas de Stock", content: "Los productos con stock igual o menor al minimo se resaltan en amarillo. Los agotados en rojo. El contador en el header muestra alertas activas.", placement: "right" },
  { id: "flow-add", target: "#sidebar-logo", title: "Agregar Productos", content: "Con el boton Nuevo Producto creas items con: nombre, SKU, categoria, proveedor, stock, stock minimo, precio compra y precio venta.", placement: "right" },
];

const TOUR_ADMIN: DemoStep[] = [
  { id: "welcome", target: "#sidebar-logo", title: "Panel de Administracion", content: "Bienvenido al panel completo de DP Sistemas. Como administrador, tienes acceso a TODOS los modulos del sistema.", placement: "right" },
  { id: "go-dashboard", target: "#nav-dashboard", title: "Dashboard General", content: "Dashboard completo: pacientes del dia, consultas activas, por cobrar, inventario bajo y accesos rapidos a cada modulo.", placement: "right", navigate: "/dashboard", waitMs: 800 },
  { id: "go-consultas", target: "#nav-consultas", title: "Cola de Consultas", content: "3 pacientes en cola por canales distintos: Rocky (Presencial/EMERGENCIA), Michi (Llamada), Pelusa (WhatsApp/Chatbot).", placement: "right", navigate: "/dashboard/consultas", waitMs: 1000 },
  { id: "explain-flow", target: "#sidebar-logo", title: "Flujo Completo", content: "Ciclo de consulta:\n1. Paciente ingresa (Presencial/Llamada/WhatsApp)\n2. Doctor atiende (diagnostico + receta)\n3. Pasa a Por Cobrar\n4. Recepcion cobra e imprime\n5. Completada", placement: "right" },
  { id: "go-pacientes", target: "#nav-pacientes", title: "Base de Pacientes", content: "Pacientes con datos reales: nombre, especie, raza, peso, sexo, color y datos del propietario.", placement: "right", navigate: "/dashboard/pacientes", waitMs: 1000 },
  { id: "go-inventario", target: "#nav-inventario", title: "Inventario", content: "Vista Excel con 60+ productos en 26 categorias. Ordena, filtra, ajusta stock y agrega nuevos items.", placement: "right", navigate: "/dashboard/inventario", waitMs: 1000 },
  { id: "go-pos", target: "#nav-pos", title: "Punto de Venta", content: "Modulo POS con imagenes de productos! Vende alimentos, accesorios, caniles y mas. Cobra con efectivo, tarjeta o transferencia.", placement: "right", navigate: "/dashboard/pos", waitMs: 1000 },
  { id: "flow-roles", target: "#org-switcher", title: "4 Roles del Sistema", content: "Cada usuario ve funciones distintas:\nRecepcion - Ingreso + Cobro + POS\nVeterinario - Diagnostico + Tratamiento\nInventario - Stock + Alertas\nAdmin - Todo el sistema", placement: "right", navigate: "/dashboard" },
  { id: "chatbot", target: "#sidebar-logo", title: "Asistente DP Sistemas", content: "El chatbot usa IA para triage automatico, agendar citas, buscar productos y recomendar tratamientos.", placement: "right" },
];

function getTourForRole(role: string) {
  switch (role) {
    case "receptionist": return TOUR_RECEPTIONIST;
    case "veterinarian": return TOUR_VETERINARIAN;
    case "inventory": return TOUR_INVENTORY;
    default: return TOUR_ADMIN;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, currentOrg, memberships, signOut, loading } = useAuth();
  const { startDemo } = useDemo();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  function handleLogout() {
    signOut();
    router.push("/login");
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // No org — user hasn't been assigned to one by admin
  if (!currentOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-10 max-w-md w-full text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sin organización asignada</h2>
          <p className="text-slate-500 text-sm mb-6">
            Tu cuenta aún no está vinculada a ninguna clínica. Contacta a tu administrador para que te asigne una organización.
          </p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-md cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Usuario";
  const userRole = currentOrg.role || "viewer";
  const navItems = getNavForRole(userRole);
  const roleMeta = ROLE_META[userRole] || ROLE_META.viewer;
  const RoleIcon = roleMeta.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ====== SIDEBAR ====== */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-white border-r border-slate-100 z-50 flex flex-col transition-all duration-300 ease-in-out shadow-sm",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          id="sidebar-logo"
          className={cn("flex items-center justify-center shrink-0 border-b border-slate-100", collapsed ? "h-16 px-4" : "h-20 px-4")}
        >
          {collapsed ? <LogoMark size={32} /> : <LogoMark size={200} />}
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="mx-3 mt-3 mb-1">
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold", roleMeta.color)}>
              <RoleIcon className="w-3.5 h-3.5" />
              {roleMeta.label}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={item.id}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl transition-all duration-200",
                  collapsed ? "justify-center p-3" : "px-3 py-2.5",
                  isActive
                    ? "bg-brand-50 text-brand-700 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-brand-600")} />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Organization info */}
        <div id="org-switcher" className={cn("border-t border-slate-100 p-3", collapsed && "flex flex-col items-center")}>
          {!collapsed && (
            <div className="flex items-center gap-3 p-2 mb-2 rounded-xl bg-brand-50/50 border border-brand-100">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(currentOrg.organization.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{currentOrg.organization.name}</p>
                <p className="text-xs text-slate-500">{roleMeta.label}</p>
              </div>
            </div>
          )}

          {/* User section */}
          {!collapsed && (
            <div className="flex items-center gap-3 p-2 mb-2 rounded-xl bg-slate-50">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(displayName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 cursor-pointer",
              collapsed ? "justify-center p-3" : "px-3 py-2.5"
            )}
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm">Cerrar Sesión</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-10 border-t border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* ====== MAIN CONTENT ====== */}
      <div className={cn("flex-1 transition-all duration-300", collapsed ? "lg:ml-[72px]" : "lg:ml-64")}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-100 h-16 flex items-center px-6 gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center">
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar pacientes, consultas..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Demo tour button */}
            <button
              id="demo-tour-btn"
              onClick={() => startDemo(getTourForRole(userRole))}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 text-xs font-semibold rounded-lg hover:bg-brand-100 transition-colors cursor-pointer border border-brand-200"
              title="Iniciar tour guiado"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Tour Demo
            </button>

            <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold lg:hidden">
              {getInitials(displayName)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Chatbot */}
      <ChatWidget />
    </div>
  );
}
