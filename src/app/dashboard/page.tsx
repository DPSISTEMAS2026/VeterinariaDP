"use client";

import { useEffect, useState } from "react";
import { Stethoscope, PawPrint, Package, Users, CalendarCheck, ArrowUpRight, Activity, TrendingUp, Plus, Clock, AlertTriangle, DollarSign, ClipboardList, UserCheck, Truck, BarChart3, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Counts { patients: number; clients: number; consultations: number; waiting: number; inProgress: number; billed: number; completed: number; lowStock: number; inventory: number; }

export default function DashboardPage() {
  const { currentOrg, profile } = useAuth();
  const [counts, setCounts] = useState<Counts>({ patients: 0, clients: 0, consultations: 0, waiting: 0, inProgress: 0, billed: 0, completed: 0, lowStock: 0, inventory: 0 });
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const role = currentOrg?.role || "viewer";

  useEffect(() => {
    if (!currentOrg) return;
    const orgId = currentOrg.organization_id;
    const sb = createClient();
    Promise.all([
      sb.from("patients").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
      sb.from("clients").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
      sb.from("consultations").select("id, status, type, reason, patient:patients(name)").eq("organization_id", orgId),
      sb.from("inventory").select("id, name, stock_quantity, min_stock, sale_price, sku").eq("organization_id", orgId),
    ]).then(([p, c, con, inv]) => {
      const cons = con.data || [];
      const invData = inv.data || [];
      const low = invData.filter((x: any) => x.min_stock > 0 && x.stock_quantity <= x.min_stock);
      setCounts({
        patients: p.count || 0, clients: c.count || 0,
        consultations: cons.length, waiting: cons.filter((x: any) => x.status === "waiting").length,
        inProgress: cons.filter((x: any) => x.status === "in_progress").length,
        billed: cons.filter((x: any) => x.status === "billed").length,
        completed: cons.filter((x: any) => x.status === "completed").length,
        lowStock: low.length, inventory: invData.length,
      });
      setWaitingList(cons.filter((x: any) => x.status === "waiting").slice(0, 6));
      setLowStockItems(low.slice(0, 6));
      setLoading(false);
    });
  }, [currentOrg]);

  const greeting = profile?.full_name || "Doctor";

  // ── RECEPCIÓN ──
  if (role === "receptionist") return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Recepción / Caja" subtitle={`Hola, ${greeting}`} org={currentOrg} />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 stagger-children">
        <StatCard label="En espera" value={counts.waiting} icon={Clock} color="from-amber-500 to-amber-600" detail="pacientes en cola" />
        <StatCard label="En atención" value={counts.inProgress} icon={Stethoscope} color="from-blue-500 to-blue-600" detail="consultas activas" />
        <StatCard label="Por cobrar" value={counts.billed} icon={DollarSign} color="from-green-500 to-green-600" detail="listas para cobro" />
        <StatCard label="Completadas" value={counts.completed} icon={UserCheck} color="from-emerald-500 to-emerald-600" detail="finalizadas hoy" />
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center"><Clock className="w-5 h-5 text-white" /></div>
                <div><h2 className="text-lg font-semibold text-slate-900">Cola de Espera</h2><p className="text-xs text-slate-500">{counts.waiting} pacientes esperando</p></div>
              </div>
              <Link href="/dashboard/consultas" className="text-sm text-brand-600 font-medium hover:underline">Ver todas →</Link>
            </div>
            {waitingList.length === 0 ? <Empty text="No hay pacientes en espera" /> : (
              <div className="space-y-2">
                {waitingList.map((c: any, i: number) => (
                  <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${c.type === "emergency" ? "bg-red-50 border-red-200 animate-pulse" : "bg-slate-50 border-slate-100 hover:border-brand-200"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${c.type === "emergency" ? "bg-red-500" : "bg-amber-500"}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{(c.patient as any)?.name || "—"}</p>
                      <p className="text-xs text-slate-500 truncate">{c.reason?.split(".")[0] || "Sin motivo"}</p>
                    </div>
                    {c.type === "emergency" && <Badge variant="danger" size="sm">🚨 URGENCIA</Badge>}
                    {c.type !== "emergency" && <Badge variant="warning" size="sm">En espera</Badge>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-3">Acciones Rápidas</h3>
            <div className="space-y-2">
              <QuickLink href="/dashboard/consultas" icon={Plus} label="Nueva Consulta" color="text-emerald-600" />
              <QuickLink href="/dashboard/pacientes" icon={PawPrint} label="Registrar Paciente" color="text-brand-600" />
              <QuickLink href="/dashboard/pos" icon={ShoppingCart} label="Punto de Venta" color="text-violet-600" />
              <QuickLink href="/dashboard/consultas" icon={ClipboardList} label="Ver Cola Completa" color="text-amber-600" />
            </div>
          </Card>
          <Card>
            <h3 className="font-semibold text-slate-900 mb-3">Resumen del Día</h3>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Total Consultas" value={counts.consultations} />
              <MiniStat label="Pacientes" value={counts.patients} />
              <MiniStat label="Clientes" value={counts.clients} />
              <MiniStat label="Emergencias" value={waitingList.filter(c => c.type === "emergency").length} danger />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  // ── VETERINARIO ──
  if (role === "veterinarian") return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Panel Clínico" subtitle={`Bienvenido, ${greeting}`} org={currentOrg} />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 stagger-children">
        <StatCard label="En espera" value={counts.waiting} icon={Clock} color="from-amber-500 to-amber-600" detail="por atender" />
        <StatCard label="En atención" value={counts.inProgress} icon={Activity} color="from-blue-500 to-blue-600" detail="consulta activa" />
        <StatCard label="Completadas" value={counts.completed} icon={UserCheck} color="from-emerald-500 to-emerald-600" detail="finalizadas" />
        <StatCard label="Pacientes" value={counts.patients} icon={PawPrint} color="from-brand-500 to-brand-600" detail="registrados" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-white" /></div>
                <div><h2 className="text-lg font-semibold">Pacientes por Atender</h2><p className="text-xs text-slate-500">Ordenados por prioridad</p></div>
              </div>
              <Link href="/dashboard/consultas" className="text-sm text-brand-600 font-medium hover:underline">Ir a Consultas →</Link>
            </div>
            {waitingList.length === 0 ? <Empty text="¡Sin pacientes en espera!" /> : (
              <div className="space-y-2">
                {[...waitingList].sort((a, b) => (a.type === "emergency" ? -1 : 1) - (b.type === "emergency" ? -1 : 1)).map((c: any) => (
                  <div key={c.id} className={`p-4 rounded-xl border ${c.type === "emergency" ? "bg-red-50 border-red-300" : "bg-white border-slate-200"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{(c.patient as any)?.name}</span>
                      {c.type === "emergency" ? <Badge variant="danger" size="sm">🚨 EMERGENCIA</Badge> : <Badge variant="warning" size="sm">Esperando</Badge>}
                    </div>
                    <p className="text-sm text-slate-600">{c.reason?.split(".")[0]}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-3">Acceso Rápido</h3>
            <div className="space-y-2">
              <QuickLink href="/dashboard/consultas" icon={Stethoscope} label="Atender Siguiente" color="text-emerald-600" />
              <QuickLink href="/dashboard/pacientes" icon={PawPrint} label="Fichas de Pacientes" color="text-brand-600" />
              <QuickLink href="/dashboard/inventario" icon={Package} label="Catálogo Medicamentos" color="text-cyan-600" />
            </div>
          </Card>
          {lowStockItems.length > 0 && (
            <Card>
              <h3 className="font-semibold text-slate-900 mb-3">⚠️ Stock Bajo Medicamentos</h3>
              <div className="space-y-1.5">
                {lowStockItems.slice(0, 4).map((it: any) => (
                  <div key={it.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 truncate">{it.name}</span>
                    <span className="text-red-600 font-semibold shrink-0">{it.stock_quantity} uds</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  // ── INVENTARIO ──
  if (role === "inventory") return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Control de Inventario" subtitle={`Hola, ${greeting}`} org={currentOrg} />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 stagger-children">
        <StatCard label="Total Productos" value={counts.inventory} icon={Package} color="from-cyan-500 to-cyan-600" detail="en catálogo" />
        <StatCard label="Stock Bajo" value={counts.lowStock} icon={AlertTriangle} color={counts.lowStock > 0 ? "from-red-500 to-red-600" : "from-emerald-500 to-emerald-600"} detail={counts.lowStock > 0 ? "¡requieren atención!" : "todo OK"} />
        <StatCard label="Categorías" value={9} icon={ClipboardList} color="from-violet-500 to-violet-600" detail="activas" />
        <StatCard label="Proveedores" value={4} icon={Truck} color="from-amber-500 to-amber-600" detail="registrados" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-white" /></div>
              <div><h2 className="text-lg font-semibold">Alertas de Stock Bajo</h2><p className="text-xs text-slate-500">{counts.lowStock} productos bajo mínimo</p></div>
            </div>
            <Link href="/dashboard/inventario" className="text-sm text-brand-600 font-medium hover:underline">Ver todo →</Link>
          </div>
          {lowStockItems.length === 0 ? <Empty text="✅ Inventario OK — sin alertas" /> : (
            <div className="space-y-2">
              {lowStockItems.map((it: any) => (
                <div key={it.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-200">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{it.name}</p>
                    <p className="text-xs text-slate-500">SKU: {it.sku} | Mín: {it.min_stock}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{it.stock_quantity}</p>
                    <p className="text-[10px] text-red-500">unidades</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Acciones de Inventario</h3>
          <div className="space-y-2">
            <QuickLink href="/dashboard/inventario" icon={Package} label="Gestionar Inventario" color="text-cyan-600" />
            <QuickLink href="/dashboard/inventario" icon={Plus} label="Agregar Producto" color="text-emerald-600" />
            <QuickLink href="/dashboard/inventario" icon={Truck} label="Órdenes de Compra" color="text-amber-600" />
            <QuickLink href="/dashboard/inventario" icon={BarChart3} label="Reportes de Stock" color="text-violet-600" />
          </div>
        </Card>
      </div>
    </div>
  );

  // ── ADMIN / OWNER (default) ──
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Administración General" subtitle={`Bienvenido, ${greeting}`} org={currentOrg} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <LinkCard href="/dashboard/pacientes" label="Pacientes" value={counts.patients} detail={`${counts.clients} clientes`} icon={PawPrint} color="from-brand-500 to-brand-600" loading={loading} />
        <LinkCard href="/dashboard/consultas" label="Consultas" value={counts.consultations} detail={`${counts.waiting} en espera`} icon={Stethoscope} color="from-emerald-500 to-emerald-600" loading={loading} />
        <LinkCard href="/dashboard/inventario" label="Inventario" value={counts.inventory} detail={`${counts.lowStock} stock bajo`} icon={Package} color={counts.lowStock > 0 ? "from-red-500 to-red-600" : "from-blue-500 to-blue-600"} loading={loading} />
        <LinkCard href="/dashboard" label="Equipo" value={"5"} detail="usuarios activos" icon={Users} color="from-violet-500 to-violet-600" loading={loading} />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center"><Clock className="w-5 h-5 text-white" /></div>
              <div><h2 className="text-lg font-semibold">Cola de Espera</h2><p className="text-xs text-slate-500">{counts.waiting} pacientes</p></div>
            </div>
            {waitingList.length === 0 ? <Empty text="Cola vacía" /> : (
              <div className="space-y-2">
                {waitingList.slice(0, 4).map((c: any, i: number) => (
                  <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border ${c.type === "emergency" ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100"}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${c.type === "emergency" ? "bg-red-500" : "bg-amber-500"}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{(c.patient as any)?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{c.reason?.split(".")[0]}</p>
                    </div>
                    {c.type === "emergency" && <Badge variant="danger" size="sm">URGENCIA</Badge>}
                  </div>
                ))}
              </div>
            )}
          </Card>
          {lowStockItems.length > 0 && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-white" /></div>
                <h2 className="text-lg font-semibold">Alertas de Stock</h2>
              </div>
              <div className="space-y-2">
                {lowStockItems.slice(0, 4).map((it: any) => (
                  <div key={it.id} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-100">
                    <span className="text-sm font-medium text-slate-900">{it.name}</span>
                    <span className="text-sm font-bold text-red-600">{it.stock_quantity}/{it.min_stock}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-3">Panel de Control</h3>
            <div className="space-y-2">
              <QuickLink href="/dashboard/pacientes" icon={PawPrint} label="Fichas de Pacientes" color="text-brand-600" />
              <QuickLink href="/dashboard/consultas" icon={Stethoscope} label="Gestionar Consultas" color="text-emerald-600" />
              <QuickLink href="/dashboard/inventario" icon={Package} label="Control de Stock" color="text-blue-600" />
            </div>
          </Card>
          <Card>
            <div className="text-center py-2">
              <Badge variant="brand" size="md">Plan {currentOrg?.organization.plan || "Professional"}</Badge>
              <p className="text-xs text-slate-500 mt-3">Acceso completo</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Shared components ── */
function Header({ title, subtitle, org }: { title: string; subtitle: string; org: any }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="text-slate-500 text-sm mt-1">{subtitle} · {org?.organization.name} · {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, detail }: { label: string; value: number; icon: any; color: string; detail: string }) {
  return (
    <Card hover padding="md">
      <div className="flex items-start justify-between">
        <div><p className="text-sm text-slate-500 font-medium">{label}</p><p className="text-2xl font-bold text-slate-900 mt-1">{value}</p><p className="text-xs text-slate-500 mt-1">{detail}</p></div>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
      </div>
    </Card>
  );
}

function LinkCard({ href, label, value, detail, icon: Icon, color, loading }: any) {
  return (
    <Link href={href}><Card hover padding="md">
      <div className="flex items-start justify-between">
        <div><p className="text-sm text-slate-500 font-medium">{label}</p><p className="text-2xl font-bold text-slate-900 mt-1">{loading ? <span className="inline-block w-8 h-7 bg-slate-200 rounded animate-pulse" /> : value}</p><p className="text-xs text-slate-500 mt-2">{detail}</p></div>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
      </div>
    </Card></Link>
  );
}

function QuickLink({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
      <Icon className={`w-5 h-5 ${color}`} /><span className="text-sm text-slate-700 group-hover:text-slate-900">{label}</span>
      <ArrowUpRight className="w-4 h-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function MiniStat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 text-center">
      <p className={`text-xl font-bold ${danger && value > 0 ? "text-red-600" : "text-slate-900"}`}>{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-center py-8 text-slate-400"><TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">{text}</p></div>;
}
