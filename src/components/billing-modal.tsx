"use client";
import { useState } from "react";
import { X, Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Med { id: string; name: string; category?: string; dosage?: string; sale_price?: number; quantity: number; included: boolean; }
interface BillingProps { consulta: any; onClose: () => void; onComplete: () => void; }

const CONSULT_PRICES: Record<string, number> = { general: 25000, emergency: 45000, surgery: 80000, vaccination: 15000, control: 20000, dental: 35000, other: 20000 };
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

function parseMeds(obs: string | null): Med[] {
  if (!obs) return [];
  const marker = "---MEDS_JSON---";
  const idx = obs.indexOf(marker);
  if (idx < 0) return [];
  try {
    const raw = JSON.parse(obs.slice(idx + marker.length).trim());
    return raw.map((m: any) => ({ ...m, quantity: m.quantity || 1, included: true }));
  } catch { return []; }
}

export default function BillingModal({ consulta, onClose, onComplete }: BillingProps) {
  const c = consulta;
  const consultPrice = CONSULT_PRICES[c.type] || 25000;
  const [meds, setMeds] = useState<Med[]>(parseMeds(c.observations));
  const [payMethod, setPayMethod] = useState("Efectivo");
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<null | "boleta" | "receta">(null);

  const toggleMed = (i: number) => setMeds(prev => prev.map((m, idx) => idx === i ? { ...m, included: !m.included } : m));
  const changeMedQty = (i: number, d: number) => setMeds(prev => prev.map((m, idx) => idx === i ? { ...m, quantity: Math.max(1, m.quantity + d) } : m));
  const totalMeds = meds.filter(m => m.included).reduce((s, m) => s + m.quantity * (m.sale_price || 0), 0);
  const total = consultPrice + totalMeds;

  async function processBilling() {
    setProcessing(true);
    const sb = createClient();
    await sb.from("consultations").update({ status: "completed" }).eq("id", c.id);
    setProcessing(false);
    onComplete();
  }

  function printDoc(type: "boleta" | "receta") {
    const p = c.patient;
    const date = new Date(c.consultation_date).toLocaleString("es-CL");
    const cleanObs = (c.observations || "").split("---MEDS_JSON---")[0].trim();
    let html = "";
    if (type === "boleta") {
      html = `<div style="font-family:Courier New,monospace;max-width:400px;margin:0 auto;padding:20px;font-size:12px">
        <div style="text-align:center;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:15px">
          <h1 style="font-size:18px">🏥 Veterinaria - DP Sistemas</h1><p>DP Sistemas - Gestión Veterinaria</p>
        </div>
        <p><b>Fecha:</b> ${date}</p><p><b>Paciente:</b> ${p?.name}</p>
        <p><b>Propietario:</b> ${p?.client?.first_name} ${p?.client?.last_name}</p>
        <hr><p><b>DETALLE</b></p>
        <div style="display:flex;justify-content:space-between"><span>Consulta (${c.type})</span><span>${fmt(consultPrice)}</span></div>
        ${meds.filter(m=>m.included).map(m=>`<div style="display:flex;justify-content:space-between"><span>${m.name} x${m.quantity}</span><span>${fmt(m.quantity*(m.sale_price||0))}</span></div>`).join("")}
        <hr style="border-top:2px dashed #000;margin-top:10px">
        <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:bold"><span>TOTAL</span><span>${fmt(total)}</span></div>
        <p>Pago: ${payMethod}</p>
        <div style="text-align:center;margin-top:15px;border-top:2px dashed #000;padding-top:10px;font-size:10px"><p>¡Gracias por confiar en nosotros!</p></div>
      </div>`;
    } else {
      html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;font-size:13px">
        <div style="text-align:center;border-bottom:2px solid #0891b2;padding-bottom:15px;margin-bottom:20px">
          <h1 style="color:#0891b2">🏥 Veterinaria - DP Sistemas</h1><p>RECETA MÉDICA</p><p style="font-size:11px">${date}</p>
        </div>
        <div style="background:#f0fdf4;padding:12px;border-radius:8px;margin-bottom:15px">
          <p><b>Paciente:</b> ${p?.name} (${p?.species?.name||"—"})</p>
          <p><b>Propietario:</b> ${p?.client?.first_name} ${p?.client?.last_name}</p>
        </div>
        <p><b>Diagnóstico:</b> ${c.diagnosis || "N/A"}</p>
        <h3 style="margin-top:15px;color:#0891b2">Medicamentos</h3>
        ${meds.filter(m=>m.included).map((m,i)=>`<div style="background:#f8fafc;padding:8px;border-radius:5px;margin:5px 0">
          <b>${i+1}. ${m.name}</b><br><span style="font-size:11px">📦 Cantidad: ${m.quantity} | 💊 ${m.dosage||"Según indicación"}</span>
        </div>`).join("")}
        <h3 style="margin-top:15px;color:#0891b2">Indicaciones</h3>
        <p style="white-space:pre-wrap">${c.treatment||"Seguir indicaciones del médico"}</p>
        ${cleanObs?`<p style="margin-top:10px;font-size:11px;color:#666"><b>Obs:</b> ${cleanObs}</p>`:""}
      </div>`;
    }
    const w = window.open("", "_blank");
    if (w) { w.document.write(`<html><head><title>${type==="boleta"?"Boleta":"Receta"}</title></head><body>${html}<script>setTimeout(()=>window.print(),300)<\/script></body></html>`); w.document.close(); }
  }

  if (receipt) return null; // handled via print window

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-6 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 mb-8 animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 rounded-t-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-between">
          <div><h2 className="text-white font-bold text-lg">💰 Cobro de Consulta</h2><p className="text-white/70 text-xs">{c.patient?.name} · {c.type}</p></div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Patient summary */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm">
            <p><strong>Paciente:</strong> {c.patient?.name} ({c.patient?.species?.name})</p>
            <p><strong>Propietario:</strong> {c.patient?.client?.first_name} {c.patient?.client?.last_name}</p>
            <p><strong>Diagnóstico:</strong> {c.diagnosis || "N/A"}</p>
          </div>
          {/* Consult fee */}
          <div className="flex justify-between p-3 bg-blue-50 rounded-xl border border-blue-200 text-sm font-semibold">
            <span>Consulta ({c.type})</span><span>{fmt(consultPrice)}</span>
          </div>
          {/* Meds */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">💊 Medicamentos Recetados</h4>
            {meds.length === 0 ? <p className="text-sm text-slate-400 italic">Sin medicamentos</p> : (
              <div className="space-y-2">{meds.map((m, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${m.included ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200 opacity-60"}`}>
                  <input type="checkbox" checked={m.included} onChange={() => toggleMed(i)} className="w-4 h-4 cursor-pointer accent-emerald-600" />
                  <div className="flex-1"><p className="font-semibold">{m.name}</p>{m.dosage && <p className="text-xs text-slate-500">📋 {m.dosage}</p>}</div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => changeMedQty(i, -1)} disabled={!m.included} className="w-7 h-7 border rounded-lg text-sm cursor-pointer disabled:opacity-30">−</button>
                    <span className="w-8 text-center font-bold">{m.quantity}</span>
                    <button onClick={() => changeMedQty(i, 1)} disabled={!m.included} className="w-7 h-7 border rounded-lg text-sm cursor-pointer disabled:opacity-30">+</button>
                  </div>
                  <span className={`min-w-[80px] text-right font-semibold ${m.included ? "text-emerald-700" : "text-red-500"}`}>
                    {m.included ? fmt(m.quantity * (m.sale_price || 0)) : "Excluido"}
                  </span>
                </div>
              ))}</div>
            )}
          </div>
          {/* Total */}
          <div className="border-t-2 border-slate-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal Medicamentos</span><span>{fmt(totalMeds)}</span></div>
            <div className="flex justify-between text-lg font-bold text-emerald-700"><span>TOTAL A PAGAR</span><span>{fmt(total)}</span></div>
          </div>
          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago</label>
            <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none">
              <option>Efectivo</option><option>Tarjeta Débito</option><option>Tarjeta Crédito</option><option>Transferencia</option>
            </select>
          </div>
          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <button onClick={() => printDoc("receta")} className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 cursor-pointer flex items-center gap-1"><Printer className="w-3.5 h-3.5" />Receta</button>
              <button onClick={() => printDoc("boleta")} className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 cursor-pointer flex items-center gap-1"><Printer className="w-3.5 h-3.5" />Boleta</button>
            </div>
            <button onClick={processBilling} disabled={processing} className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 cursor-pointer shadow-md disabled:opacity-50">
              {processing ? "Procesando..." : `✅ Confirmar Cobro — ${fmt(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
