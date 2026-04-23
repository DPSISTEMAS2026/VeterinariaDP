"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { runTriage, isEmergency, type TriageResult } from "@/lib/triage-engine";

/* ── Types ── */
interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  quickReplies?: string[];
}

type FlowState =
  | { type: "idle" }
  | { type: "triage_species" }
  | { type: "triage_symptoms"; species: string }
  | { type: "triage_result"; results: TriageResult[]; species: string; symptoms: string[] }
  | { type: "booking_name"; triageData?: { results: TriageResult[]; species: string; symptoms: string[] } }
  | { type: "booking_pet"; ownerName: string; triageData?: any }
  | { type: "booking_phone"; ownerName: string; petName: string; triageData?: any }
  | { type: "booking_confirm"; ownerName: string; petName: string; phone: string; triageData?: any };

/* ── Constants ── */
const GREETING = `¡Hola! 👋 Soy **DP**, tu asistente veterinario inteligente.

¿En qué puedo ayudarte hoy?`;

const QUICK_START = [
  "🩺 Evaluar síntomas",
  "📅 Agendar cita",
  "💊 Consultar productos",
  "📊 Estado de la clínica",
  "⚠️ Ver stock bajo",
];

/* ── Component ── */
export function ChatWidget() {
  const { currentOrg } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "g", role: "bot", content: GREETING, timestamp: new Date(), quickReplies: QUICK_START },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [flow, setFlow] = useState<FlowState>({ type: "idle" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const addBot = useCallback((content: string, quickReplies?: string[]) => {
    setMessages((m) => [...m, { id: Date.now().toString(), role: "bot", content, timestamp: new Date(), quickReplies }]);
  }, []);

  async function handleSend(text?: string) {
    const msg = (text || input).trim();
    if (!msg || thinking) return;
    setMessages((m) => [...m, { id: Date.now().toString(), role: "user", content: msg, timestamp: new Date() }]);
    setInput("");
    setThinking(true);

    await processInput(msg);
    setThinking(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function processInput(msg: string) {
    const orgId = currentOrg?.organization_id || "00000000-0000-0000-0000-000000000001";
    const q = msg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // ── Flow-based responses ──
    if (flow.type === "triage_species") {
      setFlow({ type: "triage_symptoms", species: msg });
      addBot(`Entendido, un **${msg}**.\n\nDescríbeme los síntomas que presenta. Puedes escribirlos separados por coma.\n\n_Ejemplo: vómitos, diarrea, no quiere comer_`);
      return;
    }

    if (flow.type === "triage_symptoms") {
      const symptoms = msg.split(/,|y /).map(s => s.trim()).filter(Boolean);
      const results = runTriage(flow.species, symptoms);
      const isUrgent = isEmergency(results);

      if (results.length === 0) {
        addBot("No pude encontrar condiciones que coincidan con esos síntomas. Te recomiendo agendar una consulta presencial para una evaluación completa.", ["📅 Agendar cita", "🔄 Intentar de nuevo"]);
        setFlow({ type: "idle" });
        return;
      }

      const header = isUrgent
        ? "🚨 **¡ATENCIÓN! Los síntomas sugieren una situación de URGENCIA.**\nTe recomendamos acudir de inmediato a la clínica.\n\n"
        : "📋 **Resultado del triage:**\n\n";

      const body = results.map((r, i) => {
        const emoji = r.severity.includes("Crít") ? "🔴" : r.severity.includes("Alta") ? "🟠" : "🟡";
        return `${i + 1}. ${emoji} **${r.condition}** (${r.matchScore}% coincidencia)\n   _${r.description}_\n   Gravedad: ${r.severity} | Urgencia: ${r.urgency}\n   💊 ${r.treatment}`;
      }).join("\n\n");

      const footer = "\n\n⚠️ _Este es un diagnóstico preliminar. Siempre confirmar con un veterinario._";
      const triageData = { results, species: flow.species, symptoms };

      setFlow({ type: "triage_result", ...triageData });
      addBot(header + body + footer, ["📅 Agendar cita con estos datos", "🔄 Evaluar otros síntomas", "🏠 Volver al inicio"]);
      return;
    }

    if (flow.type === "booking_name") {
      setFlow({ ...flow, type: "booking_pet", ownerName: msg });
      addBot(`Perfecto **${msg}**. ¿Cuál es el nombre de tu mascota y qué tipo de animal es?\n\n_Ejemplo: Max, perro_`);
      return;
    }

    if (flow.type === "booking_pet") {
      setFlow({ ...flow, type: "booking_phone", petName: msg });
      addBot("¿Cuál es tu número de teléfono para contactarte?");
      return;
    }

    if (flow.type === "booking_phone") {
      const data = { ownerName: (flow as any).ownerName, petName: (flow as any).petName, phone: msg, triageData: (flow as any).triageData };
      setFlow({ type: "booking_confirm", ...data });

      const triageNote = data.triageData?.results
        ? `\n🩺 Triage: ${data.triageData.results.map((r: TriageResult) => r.condition).join(", ")}`
        : "";

      addBot(`Confirma los datos de tu cita:\n\n👤 **Dueño:** ${data.ownerName}\n🐾 **Mascota:** ${data.petName}\n📞 **Teléfono:** ${data.phone}${triageNote}\n\n¿Confirmar agendamiento?`, ["✅ Confirmar", "❌ Cancelar"]);
      return;
    }

    if (flow.type === "booking_confirm") {
      if (q.includes("confirmar") || q.includes("si") || q.includes("✅")) {
        const fd = flow as any;
        const sb = createClient();
        // Create the consultation as alert
        const triageObs = fd.triageData?.results
          ? `TRIAGE AUTOMÁTICO: ${fd.triageData.results.map((r: TriageResult) => `${r.condition} (${r.matchScore}%)`).join(", ")}. Síntomas: ${fd.triageData.symptoms?.join(", ") || "No especificados"}`
          : "Agendado vía chatbot DP";

        // Try to find/create patient
        const reason = fd.triageData?.results?.[0]
          ? `${fd.triageData.results[0].condition} — Ingreso vía Chatbot DP`
          : "Consulta agendada vía Chatbot DP";

        // Insert consultation alert
        const patientQuery = await sb.from("patients").select("id").eq("organization_id", orgId).ilike("name", `%${fd.petName.split(",")[0].trim()}%`).limit(1);
        const patientId = patientQuery.data?.[0]?.id;

        if (patientId) {
          await sb.from("consultations").insert({
            organization_id: orgId,
            patient_id: patientId,
            type: fd.triageData?.results?.some((r: TriageResult) => r.urgency.includes("Emergencia")) ? "emergency" : "general",
            status: "waiting",
            reason,
            observations: `${triageObs}\n\nDueño: ${fd.ownerName} | Tel: ${fd.phone}`,
          });
        }

        setFlow({ type: "idle" });
        addBot(`✅ **¡Cita agendada exitosamente!**\n\n🏥 La clínica ya recibió tu alerta${fd.triageData ? " con el diagnóstico preliminar" : ""}. Estarán preparados para recibir a **${fd.petName}**.\n\n📞 Si es urgente, llama directamente al **+56 2 2345 6789**.\n\n¿Necesitas algo más?`, QUICK_START);
        return;
      } else {
        setFlow({ type: "idle" });
        addBot("Cita cancelada. ¿En qué más puedo ayudarte?", QUICK_START);
        return;
      }
    }

    // ── Intent detection ──
    if (q.includes("evaluar") || q.includes("sintoma") || q.includes("triage") || q.includes("diagnostico") || q.includes("🩺")) {
      setFlow({ type: "triage_species" });
      addBot("¡Vamos a evaluar los síntomas! 🩺\n\n¿Qué tipo de mascota es?", ["🐕 Perro", "🐈 Gato"]);
      return;
    }

    if (q.includes("agendar") || q.includes("cita") || q.includes("reservar") || q.includes("📅")) {
      const triageData = flow.type === "triage_result" ? { results: flow.results, species: flow.species, symptoms: flow.symptoms } : undefined;
      setFlow({ type: "booking_name", triageData });
      addBot("📅 ¡Perfecto! Vamos a agendar tu cita.\n\n¿Cuál es tu nombre completo?");
      return;
    }

    // ── Supabase queries ──
    const sb = createClient();

    if (q.includes("producto") || q.includes("medicamento") || q.includes("💊") || q.includes("consultar producto")) {
      addBot("¿Qué producto o medicamento buscas? Escribe el nombre.\n\n_Ejemplo: Simparica, Amoxicilina, vacuna_");
      return;
    }

    if (q.includes("stock bajo") || q.includes("alerta") || q.includes("⚠️")) {
      const { data } = await sb.from("inventory").select("name, stock_quantity, min_stock, sale_price").eq("organization_id", orgId).gt("min_stock", 0);
      const low = data?.filter((i: any) => i.stock_quantity <= i.min_stock) || [];
      if (!low.length) { addBot("✅ ¡Inventario OK! No hay productos con stock bajo.", QUICK_START); return; }
      addBot(`🔴 **${low.length} productos con stock bajo:**\n\n${low.map((i: any) => `• ⚠️ **${i.name}**: ${i.stock_quantity}/${i.min_stock} uds — $${(i.sale_price||0).toLocaleString("es-CL")}`).join("\n")}`, QUICK_START);
      return;
    }

    if (q.includes("estado") || q.includes("clinica") || q.includes("resumen") || q.includes("📊")) {
      const [p, cw, ct, inv] = await Promise.all([
        sb.from("patients").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        sb.from("consultations").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "waiting"),
        sb.from("consultations").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        sb.from("inventory").select("id, stock_quantity, min_stock").eq("organization_id", orgId).gt("min_stock", 0),
      ]);
      const low = inv.data?.filter((i: any) => i.stock_quantity <= i.min_stock).length || 0;
      addBot(`📊 **Estado de la Clínica:**\n\n• 🐾 **${p.count}** pacientes\n• 🏥 **${cw.count}** en espera\n• 📋 **${ct.count}** consultas totales\n• ${low > 0 ? `⚠️ **${low}** stock bajo` : "✅ Inventario OK"}`, QUICK_START);
      return;
    }

    if (q.includes("espera") || q.includes("cola") || q.includes("pendiente")) {
      const { data } = await sb.from("consultations").select("type, reason, patient:patients(name)").eq("organization_id", orgId).eq("status", "waiting");
      if (!data?.length) { addBot("✅ No hay pacientes en espera.", QUICK_START); return; }
      addBot(`🏥 **Cola de espera (${data.length}):**\n\n${data.map((c: any, i: number) => `${i+1}. **${c.patient?.name || "—"}** — ${c.reason?.split(".")[0] || c.type}`).join("\n")}`, QUICK_START);
      return;
    }

    if (q.includes("inicio") || q.includes("menu") || q.includes("volver") || q.includes("🏠")) {
      setFlow({ type: "idle" });
      addBot("¿En qué puedo ayudarte?", QUICK_START);
      return;
    }

    // Product/med search fallback
    const searchClean = msg.replace(/busca|buscar|hay|tenemos|producto|medicamento/gi, "").trim();
    if (searchClean.length > 2) {
      const { data } = await sb.from("inventory").select("name, stock_quantity, min_stock, sale_price").eq("organization_id", orgId).ilike("name", `%${searchClean}%`);
      if (data?.length) {
        addBot(`💊 **Resultados para "${searchClean}":**\n\n${data.slice(0,6).map((i: any) => `${i.min_stock > 0 && i.stock_quantity <= i.min_stock ? "🔴" : "🟢"} **${i.name}** — ${i.stock_quantity} uds | $${(i.sale_price||0).toLocaleString("es-CL")}`).join("\n")}${data.length > 6 ? `\n\n_...y ${data.length-6} más_` : ""}`, QUICK_START);
        return;
      }
    }

    addBot("No entendí tu consulta 🤔 ¿Puedes intentar de otra forma?", QUICK_START);
  }

  return (
    <>
      {/* ── Floating mascot button ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 group cursor-pointer"
        >
          <div className="relative">
            <div className="w-[72px] h-[72px] rounded-full bg-white shadow-xl border-2 border-brand-200 overflow-hidden hover:scale-110 transition-all duration-300 group-hover:border-brand-400 group-hover:shadow-brand-200/50 group-hover:shadow-2xl">
              <Image src="/dp-bot.png" alt="DP Asistente" width={72} height={72} className="object-cover scale-125 translate-y-1" />
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white animate-pulse shadow-lg">1</span>
            <div className="absolute -left-36 bottom-2 bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
              ¡Hola! Soy DP, tu asistente 👋
            </div>
          </div>
        </button>
      )}

      {/* ── Chat window ── */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scale-in">
          {/* Header with mascot */}
          <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-full bg-white overflow-hidden border-2 border-white/30 shadow-lg shrink-0">
              <Image src="/dp-bot.png" alt="DP" width={44} height={44} className="object-cover scale-125 translate-y-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm">DP — Asistente Veterinario</h4>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-white/70 text-xs">En línea</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50 to-white">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "bot" && (
                    <div className="w-7 h-7 rounded-full bg-white border border-brand-200 overflow-hidden shrink-0 mt-0.5 shadow-sm">
                      <Image src="/dp-bot.png" alt="DP" width={28} height={28} className="object-cover scale-125 translate-y-0.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-brand-600 text-white rounded-br-md"
                        : "bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm"
                    }`}
                    dangerouslySetInnerHTML={{ __html: fmtMd(msg.content) }}
                  />
                </div>
                {/* Quick replies */}
                {msg.role === "bot" && msg.quickReplies && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
                    {msg.quickReplies.map((qr) => (
                      <button
                        key={qr}
                        onClick={() => handleSend(qr)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200 rounded-full hover:bg-brand-100 hover:border-brand-300 transition-all cursor-pointer"
                      >
                        {qr} <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {thinking && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-white border border-brand-200 overflow-hidden shrink-0 shadow-sm">
                  <Image src="/dp-bot.png" alt="DP" width={28} height={28} className="object-cover scale-125 translate-y-0.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-100 bg-white shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu consulta..."
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                disabled={thinking}
              />
              <button type="submit" disabled={!input.trim() || thinking} className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center hover:bg-brand-700 transition-all disabled:opacity-40 cursor-pointer shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">Powered by DP Sistemas 🤖</p>
          </div>
        </div>
      )}
    </>
  );
}

function fmtMd(t: string): string {
  return t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/_(.*?)_/g,"<em>$1</em>").replace(/\n/g,"<br/>");
}
