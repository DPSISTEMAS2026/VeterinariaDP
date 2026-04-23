"use client";

import { useEffect, useState } from "react";
import { Package, Plus, Search, X, Loader2, AlertTriangle, Eye, ChevronUp, ChevronDown, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { formatCLP } from "@/lib/utils";

interface InventoryRow {
  id: string; name: string; sku: string; description: string; unit: string;
  stock_quantity: number; min_stock: number; purchase_price: number; sale_price: number;
  supplier: string; expiration_date: string; is_active: boolean;
  category: { id: string; name: string } | null;
}

type SortKey = "name" | "stock_quantity" | "sale_price" | "supplier" | "category";
type SortDir = "asc" | "desc";

export default function InventarioPage() {
  const { currentOrg } = useAuth();
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState("all");
  const [filterCat, setFilterCat] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", category_id: "", unit: "unit", stock_quantity: "", min_stock: "5", purchase_price: "", sale_price: "", supplier: "", expiration_date: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const role = currentOrg?.role || "viewer";
  const canEdit = ["inventory", "admin", "owner"].includes(role);
  const isReadOnly = !canEdit;

  useEffect(() => { if (currentOrg) fetchData(); }, [currentOrg]);

  async function fetchData() {
    const sb = createClient();
    const orgId = currentOrg!.organization_id;
    const [iRes, cRes] = await Promise.all([
      sb.from("inventory").select("*, category:inventory_categories(id, name)").eq("organization_id", orgId).order("name"),
      sb.from("inventory_categories").select("id, name").eq("organization_id", orgId).order("name"),
    ]);
    setItems((iRes.data || []) as unknown as InventoryRow[]);
    setCategories(cRes.data || []);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    if (!form.name) { setFormError("Nombre requerido"); return; }
    setSaving(true); setFormError("");
    const sb = createClient();
    const { error } = await sb.from("inventory").insert({
      organization_id: currentOrg!.organization_id, name: form.name, sku: form.sku || null,
      category_id: form.category_id || null, unit: form.unit, stock_quantity: parseInt(form.stock_quantity) || 0,
      min_stock: parseInt(form.min_stock) || 5, purchase_price: parseFloat(form.purchase_price) || null,
      sale_price: parseFloat(form.sale_price) || null, supplier: form.supplier || null,
      expiration_date: form.expiration_date || null,
    });
    if (error) { setFormError(error.message); setSaving(false); return; }
    setShowForm(false); setForm({ name: "", sku: "", category_id: "", unit: "unit", stock_quantity: "", min_stock: "5", purchase_price: "", sale_price: "", supplier: "", expiration_date: "" });
    setSaving(false); fetchData();
  }

  async function adjustStock(id: string, delta: number) {
    if (!canEdit) return;
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.stock_quantity + delta);
    const sb = createClient();
    await sb.from("inventory").update({ stock_quantity: newQty }).eq("id", id);
    fetchData();
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const suppliers = [...new Set(items.map(i => i.supplier).filter(Boolean))].sort();

  const filtered = items
    .filter((i) => filterStock === "all" || (filterStock === "low" && i.stock_quantity <= i.min_stock) || (filterStock === "out" && i.stock_quantity === 0) || (filterStock === "ok" && i.stock_quantity > i.min_stock))
    .filter((i) => !filterCat || i.category?.name === filterCat)
    .filter((i) => !filterSupplier || i.supplier === filterSupplier)
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase()) || i.supplier?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let va: any, vb: any;
      if (sortKey === "category") { va = a.category?.name || ""; vb = b.category?.name || ""; }
      else { va = a[sortKey]; vb = b[sortKey]; }
      if (typeof va === "string") { va = va.toLowerCase(); vb = (vb || "").toLowerCase(); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const lowStockCount = items.filter((i) => i.min_stock > 0 && i.stock_quantity <= i.min_stock).length;
  const outOfStockCount = items.filter((i) => i.stock_quantity === 0).length;

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-slate-300" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-brand-600" /> : <ChevronDown className="w-3 h-3 text-brand-600" />;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {isReadOnly && <Eye className="w-5 h-5 text-brand-500" />}
            {isReadOnly ? "Catálogo de Medicamentos" : "Inventario"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {items.length} productos
            {lowStockCount > 0 && <> · <span className="text-amber-600 font-semibold">{lowStockCount} stock bajo</span></>}
            {outOfStockCount > 0 && <> · <span className="text-red-600 font-semibold">{outOfStockCount} agotados</span></>}
            {isReadOnly && <> · <span className="text-brand-600 font-medium">Solo lectura</span></>}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? <><X className="w-4 h-4" />Cancelar</> : <><Plus className="w-4 h-4" />Nuevo Producto</>}</Button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre, SKU o proveedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2 text-xs rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none bg-white min-w-[140px]">
          <option value="">📁 Todas categorías</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} className="px-3 py-2 text-xs rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none bg-white min-w-[140px]">
          <option value="">🏭 Todos proveedores</option>
          {suppliers.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { value: "all", label: "Todos" },
            { value: "ok", label: "✅ Disponibles" },
            { value: "low", label: `⚠️ Bajo (${lowStockCount})` },
            { value: "out", label: `🚫 Agotados (${outOfStockCount})` },
          ].map((f) => (
            <button key={f.value} onClick={() => setFilterStock(f.value)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${filterStock === f.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Add form — only for editors */}
      {showForm && canEdit && (
        <Card className="animate-slide-down">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Nuevo Producto</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Amoxicilina 500mg" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">SKU</label><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="AMX-500" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label><input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Veterquímica" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" /></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none bg-white">
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Stock</label><input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} placeholder="0" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Stock mín.</label><input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">P. Compra</label><input type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} placeholder="8500" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">P. Venta</label><input type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} placeholder="15200" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" /></div>
            </div>
            {formError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">✕ {formError}</p>}
            <Button type="submit" disabled={saving}>{saving ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : <><Package className="w-4 h-4" />Agregar Producto</>}</Button>
          </form>
        </Card>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 bg-white rounded-lg animate-pulse border border-slate-100" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><div className="text-center py-12 text-slate-400"><Package className="w-14 h-14 mx-auto mb-3 opacity-30" /><p className="text-sm">{search || filterStock !== "all" || filterCat || filterSupplier ? "Sin resultados para los filtros aplicados" : "Sin productos registrados"}</p></div></Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 w-8">#</th>
                  <th className="text-left py-3 px-4">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">
                      Producto <SortIcon col="name" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4">
                    <button onClick={() => toggleSort("category")} className="flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">
                      Categoría <SortIcon col="category" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4">
                    <button onClick={() => toggleSort("supplier")} className="flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">
                      Proveedor <SortIcon col="supplier" />
                    </button>
                  </th>
                  <th className="text-right py-3 px-4">
                    <button onClick={() => toggleSort("sale_price")} className="flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 cursor-pointer ml-auto">
                      Precio <SortIcon col="sale_price" />
                    </button>
                  </th>
                  <th className="text-center py-3 px-4">
                    <button onClick={() => toggleSort("stock_quantity")} className="flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 cursor-pointer mx-auto">
                      Stock <SortIcon col="stock_quantity" />
                    </button>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Estado</th>
                  {canEdit && <th className="text-center py-3 px-4 font-semibold text-slate-600 w-28">Ajustar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx) => {
                  const isLow = item.min_stock > 0 && item.stock_quantity <= item.min_stock;
                  const isOut = item.stock_quantity === 0;
                  return (
                    <tr key={item.id} className={`transition-colors ${isOut ? "bg-red-50/50" : isLow ? "bg-amber-50/50" : "hover:bg-slate-50"}`}>
                      <td className="py-2.5 px-4 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="py-2.5 px-4">
                        <div>
                          <span className="font-medium text-slate-900">{item.name}</span>
                          {item.sku && <span className="text-xs text-slate-400 ml-2">SKU: {item.sku}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        {item.category?.name ? <Badge size="sm">{item.category.name}</Badge> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 text-xs">{item.supplier || "—"}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                        {item.sale_price ? formatCLP(item.sale_price) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`font-bold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-900"}`}>
                          {item.stock_quantity}
                        </span>
                        {item.min_stock > 0 && <span className="text-slate-400 text-xs">/{item.min_stock}</span>}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Agotado</span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Bajo</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">OK</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => adjustStock(item.id, -1)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 flex items-center justify-center transition-all font-bold cursor-pointer text-xs">−</button>
                            <button onClick={() => adjustStock(item.id, 1)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition-all font-bold cursor-pointer text-xs">+</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
            <span>Mostrando {filtered.length} de {items.length} productos</span>
            {(search || filterCat || filterSupplier || filterStock !== "all") && (
              <button onClick={() => { setSearch(""); setFilterCat(""); setFilterSupplier(""); setFilterStock("all"); }} className="text-brand-600 font-semibold hover:underline cursor-pointer">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
