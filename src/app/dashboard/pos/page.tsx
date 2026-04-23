"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, Banknote, Smartphone, Receipt, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { formatCLP } from "@/lib/utils";
import Image from "next/image";

interface Product {
  id: string; name: string; sale_price: number; stock_quantity: number;
  image_url: string | null;
  category: { name: string } | null;
}
interface CartItem extends Product { qty: number; }

export default function PosPage() {
  const { currentOrg } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<{ items: CartItem[]; total: number; method: string; date: string } | null>(null);

  useEffect(() => { if (currentOrg) fetchProducts(); }, [currentOrg]);

  async function fetchProducts() {
    const sb = createClient();
    const { data } = await sb
      .from("inventory")
      .select("id, name, sale_price, stock_quantity, image_url, category:inventory_categories(name)")
      .eq("organization_id", currentOrg!.organization_id)
      .gt("sale_price", 0)
      .gt("stock_quantity", 0)
      .not("image_url", "is", null)
      .order("name");
    const items = (data || []) as unknown as Product[];
    setProducts(items);
    const cats = [...new Set(items.map(p => p.category?.name).filter(Boolean))] as string[];
    setCategories(cats);
    setLoading(false);
  }

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock_quantity) return prev;
        return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart(prev =>
      prev.map(c => {
        if (c.id !== id) return c;
        const newQty = c.qty + delta;
        if (newQty <= 0) return c;
        if (newQty > c.stock_quantity) return c;
        return { ...c, qty: newQty };
      })
    );
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(c => c.id !== id));
  }

  const total = cart.reduce((sum, c) => sum + c.sale_price * c.qty, 0);

  async function completeSale() {
    const sb = createClient();
    for (const item of cart) {
      await sb.from("inventory")
        .update({ stock_quantity: item.stock_quantity - item.qty })
        .eq("id", item.id);
    }
    const methods = { cash: "Efectivo", card: "Tarjeta", transfer: "Transferencia" };
    setLastSale({ items: [...cart], total, method: methods[payMethod], date: new Date().toLocaleString("es-CL") });
    setShowReceipt(true);
    setCart([]);
    fetchProducts();
  }

  function printReceipt() {
    if (!lastSale) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const items = lastSale.items.map(i =>
      `<tr><td>${i.name}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">${formatCLP(i.sale_price)}</td><td style="text-align:right">${formatCLP(i.sale_price * i.qty)}</td></tr>`
    ).join("");
    w.document.write(`<html><head><title>Boleta</title></head><body style="font-family:Courier New,monospace;max-width:400px;margin:0 auto;padding:20px;font-size:12px">
      <div style="text-align:center;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:15px">
        <h2>DP Sistemas</h2><p>Veterinaria Demo</p><p style="font-size:10px">${lastSale.date}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:15px">
        <tr style="border-bottom:1px solid #ccc;font-weight:bold"><td>Producto</td><td style="text-align:center">Cant</td><td style="text-align:right">P.Unit</td><td style="text-align:right">Total</td></tr>
        ${items}
      </table>
      <div style="border-top:2px dashed #000;padding-top:10px;text-align:right">
        <p style="font-size:16px;font-weight:bold">TOTAL: ${formatCLP(lastSale.total)}</p>
        <p>Pagado con: ${lastSale.method}</p>
      </div>
      <script>setTimeout(()=>window.print(),300)<\/script></body></html>`);
    w.document.close();
  }

  const filtered = products
    .filter(p => !filterCat || p.category?.name === filterCat)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Punto de Venta</h1>
          <p className="text-slate-500 text-sm mt-1">Venta de productos, alimentos y accesorios</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Package className="w-4 h-4" />
          {products.length} productos disponibles
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Product grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search + filter */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" />
            </div>
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              <button onClick={() => setFilterCat("")} className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${!filterCat ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Todos</button>
              {categories.map(c => (
                <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${filterCat === c ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{c}</button>
              ))}
            </div>
          </div>

          {/* Product cards */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-56 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map(p => {
                const inCart = cart.find(c => c.id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`group relative rounded-2xl border-2 text-left transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1 overflow-hidden ${
                      inCart ? "border-brand-400 shadow-brand-100 shadow-md" : "border-slate-100 bg-white hover:border-brand-200"
                    }`}
                  >
                    {/* Product image */}
                    <div className="relative w-full aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:768px) 50vw, 33vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                      {inCart && (
                        <span className="absolute top-2 right-2 w-8 h-8 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center shadow-lg">{inCart.qty}</span>
                      )}
                      {p.stock_quantity <= 3 && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white shadow">Quedan {p.stock_quantity}</span>
                      )}
                    </div>
                    {/* Product info */}
                    <div className="p-3">
                      {p.category?.name && <Badge size="sm" className="mb-1.5">{p.category.name}</Badge>}
                      <p className="font-semibold text-slate-900 text-sm leading-tight mb-1 line-clamp-2">{p.name}</p>
                      <p className="text-lg font-bold text-brand-700">{formatCLP(p.sale_price)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Carrito</h2>
                <p className="text-xs text-slate-500">{cart.length} producto{cart.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShoppingCart className="w-14 h-14 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Carrito vacío</p>
                <p className="text-xs mt-1">Haz click en un producto para agregarlo</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto mb-4 pr-1">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      {/* Mini image */}
                      <div className="w-12 h-12 rounded-lg bg-white border border-slate-100 overflow-hidden shrink-0 relative">
                        {item.image_url ? (
                          <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-slate-300" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500">{formatCLP(item.sale_price)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-red-50 text-slate-600 hover:text-red-600 flex items-center justify-center cursor-pointer transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-900">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 flex items-center justify-center cursor-pointer transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs font-bold text-slate-900 w-16 text-right">{formatCLP(item.sale_price * item.qty)}</p>
                      <button onClick={() => removeFromCart(item.id)} className="p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal (IVA incl.)</span>
                    <span>{formatCLP(total)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-slate-900">
                    <span>Total</span>
                    <span className="text-brand-700">{formatCLP(total)}</span>
                  </div>
                </div>

                {/* Payment method */}
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Método de pago</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "cash" as const, icon: Banknote, label: "Efectivo" },
                      { id: "card" as const, icon: CreditCard, label: "Tarjeta" },
                      { id: "transfer" as const, icon: Smartphone, label: "Transfer." },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setPayMethod(m.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          payMethod === m.id ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <m.icon className="w-5 h-5" />
                        <span className="text-[11px] font-semibold">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Complete sale */}
                <Button onClick={completeSale} className="w-full mt-4 py-3 text-base">
                  <Receipt className="w-5 h-5" />
                  Cobrar {formatCLP(total)}
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Receipt modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReceipt(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">¡Venta Completada!</h2>
              <p className="text-sm text-slate-500 mt-1">{lastSale.date}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-2">
              {lastSale.items.map(i => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span className="text-slate-700">{i.qty}x {i.name}</span>
                  <span className="font-semibold">{formatCLP(i.sale_price * i.qty)}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-brand-700">{formatCLP(lastSale.total)}</span>
              </div>
              <p className="text-xs text-slate-500">Pagado con: {lastSale.method}</p>
            </div>

            <div className="flex gap-3">
              <Button onClick={printReceipt} variant="secondary" className="flex-1">
                Imprimir Boleta
              </Button>
              <Button onClick={() => setShowReceipt(false)} className="flex-1">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
