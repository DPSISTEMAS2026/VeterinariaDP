"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, Plus, Search, X, Loader2, Clock, CheckCircle, AlertTriangle, DollarSign, Printer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import BillingModal from "@/components/billing-modal";

interface ConsultationRow {
  id: string; consultation_date: string; type: string; status: string; reason: string;
  diagnosis: string | null; treatment: string | null; observations: string | null;
  patient: { id: string; name: string; weight_kg: number | null; sex: string; color: string; notes: string | null;
    species: { name: string } | null; breeds: { name: string } | null;
    client: { first_name: string; last_name: string; phone: string; email: string } | null;
  } | null;
}

const STATUS_CFG: Record<string, { label: string; variant: "warning" | "info" | "success" | "danger" | "default"; icon: typeof Clock }> = {
  waiting: { label: "En Espera", variant: "warning", icon: Clock },
  in_progress: { label: "En Atención", variant: "info", icon: Stethoscope },
  billed: { label: "Por Cobrar", variant: "danger", icon: DollarSign },
  completed: { label: "Completada", variant: "success", icon: CheckCircle },
  cancelled: { label: "Cancelada", variant: "default", icon: X },
};

const TYPE_LABELS: Record<string, string> = {
  general: "General", emergency: "Emergencia", surgery: "Cirugía", vaccination: "Vacunación",
  control: "Control", grooming: "Peluquería", dental: "Dental", other: "Otro",
};

export default function ConsultasPage() {
  const { currentOrg } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [patients, setPatients] = useState<{ id: string; name: string; species?: { name: string } | null; client?: { first_name: string; last_name: string } | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("queue");
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"search" | "new">("search");
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [form, setForm] = useState({ pet_name: "", species: "perro", breed: "", weight: "", age: "", owner_name: "", owner_phone: "", owner_email: "", type: "general", reason: "", status: "waiting" });
  const [symptomTags, setSymptomTags] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [billingConsulta, setBillingConsulta] = useState<ConsultationRow | null>(null);
  const router = useRouter();
  const role = currentOrg?.role || "viewer";
  const SYMPTOMS_DB: { cat: string; items: string[] }[] = [
    { cat: "Digestivo", items: ["Vómitos", "Vómitos severos", "Vómitos con sangre", "Diarrea", "Diarrea con sangre", "Diarrea hemorrágica", "Pérdida de apetito", "Rechazo de comida", "Dolor abdominal", "Dolor abdominal severo", "Abdomen hinchado", "Arcadas sin vómito", "Flatulencias", "Apetito aumentado", "Postura de oración", "Salivación excesiva"] },
    { cat: "Piel / Dermatología", items: ["Picazón", "Rascado excesivo", "Rascado de orejas", "Enrojecimiento de piel", "Piel irritada", "Pérdida de pelo", "Alopecia", "Caída de pelo", "Costras", "Lamido excesivo de patas", "Prurito", "Sarna", "Hongos en piel", "Dermatitis", "Nódulos / Bultos"] },
    { cat: "Respiratorio", items: ["Tos", "Tos seca", "Estornudos", "Dificultad para respirar", "Secreción nasal", "Jadeo excesivo", "Respiración rápida", "Sibilancias", "Congestión nasal"] },
    { cat: "Musculoesquelético", items: ["Cojera", "Cojera severa", "Cojera trasera", "No apoya pata", "Dificultad para levantarse", "Dificultad con escaleras", "Rigidez", "Renuencia a correr", "Atrofia muscular", "Deformidad", "Inflamación", "Fracturas", "No camina"] },
    { cat: "Urinario", items: ["Orina frecuente", "Esfuerzo para orinar", "Sangre en orina", "Orina turbia", "Dolor al orinar", "Incontinencia", "Lamido de genitales", "Orina fuera de la caja", "Maúlla al orinar", "Orina mucho"] },
    { cat: "Neurológico", items: ["Convulsiones", "Temblores", "Parálisis", "Pérdida de consciencia", "Movimientos involuntarios", "Desorientación", "Rigidez muscular", "Inclinación de cabeza", "Ataxia / Incoordinación", "Colapso"] },
    { cat: "Ocular", items: ["Secreción ocular", "Conjuntivitis", "Ojos rojos", "Ojos nublados", "Lagrimeo excesivo", "Párpados hinchados", "Cataratas", "Tercer párpado visible"] },
    { cat: "Oído", items: ["Dolor de orejas", "Mal olor en oído", "Secreción del oído", "Inflamación de oreja", "Sacude la cabeza", "Sordera"] },
    { cat: "Dental / Oral", items: ["Mal aliento", "Encías rojas", "Encías sangrantes", "Sarro dental", "Dientes flojos", "Dolor al comer", "Babeo excesivo"] },
    { cat: "General / Sistémico", items: ["Fiebre", "Fiebre alta", "Decaimiento", "Letargia", "Letargia extrema", "Pérdida de peso", "Deshidratación", "Deshidratación severa", "Sed excesiva", "Pelaje opaco", "Debilidad", "Debilidad en patas", "Inquietud"] },
    { cat: "Heridas / Trauma", items: ["Heridas", "Sangrado", "Mordedura", "Quemadura", "Cuerpo extraño", "Absceso", "Traumatismo", "Gime de dolor", "Dolor intenso"] },
    { cat: "Cardíaco", items: ["Tos nocturna", "Intolerancia al ejercicio", "Desmayos", "Cianosis / Lengua azul", "Pulso irregular", "Edema en extremidades"] },
    { cat: "Reproductivo", items: ["Secreción vaginal", "Secreción vulvar purulenta", "Inflamación mamaria", "Dificultad en parto", "Celo prolongado", "Criptorquidia"] },
    { cat: "Parásitos", items: ["Parásitos externos", "Pulgas", "Garrapatas", "Parásitos internos", "Gusanos en heces", "Prurito anal", "Se arrastra sentado"] },
    { cat: "Comportamiento", items: ["Agresividad inusual", "Ansiedad", "Aullidos excesivos", "Come objetos no alimentarios", "Destrucción de objetos", "Miedo excesivo", "Lamido compulsivo"] },
  ];
  const allSymptoms = SYMPTOMS_DB.flatMap(c => c.items);
  const filteredSymptoms = symptomInput.length >= 2 ? allSymptoms.filter(s => s.toLowerCase().includes(symptomInput.toLowerCase()) && !symptomTags.includes(s)).slice(0, 8) : [];
  const searchResults = patientSearch.length >= 2 ? patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase())).slice(0, 5) : [];

  const fetchData = useCallback(async () => {
    if (!currentOrg) return;
    const sb = createClient();
    const orgId = currentOrg.organization_id;
    const [cRes, pRes] = await Promise.all([
      sb.from("consultations").select("*, patient:patients(id, name, weight_kg, sex, color, notes, species:species(name), breeds:breeds(name), client:clients(first_name, last_name, phone, email))").eq("organization_id", orgId).order("consultation_date", { ascending: false }),
      sb.from("patients").select("id, name, species:species(name), client:clients(first_name, last_name)").eq("organization_id", orgId).order("name"),
    ]);
    setConsultations((cRes.data || []) as unknown as ConsultationRow[]);
    setPatients((pRes.data || []) as any);
    setLoading(false);
  }, [currentOrg]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError("");
    const sb = createClient();
    const orgId = currentOrg!.organization_id;
    try {
      let patientId: string;
      if (selectedPatient) { patientId = selectedPatient.id; }
      else {
        if (!form.pet_name.trim()) { setFormError("Nombre de la mascota requerido"); setSaving(false); return; }
        if (!form.owner_name.trim()) { setFormError("Nombre del propietario requerido"); setSaving(false); return; }
        const specMap: Record<string,string> = { perro:"Canino", gato:"Felino", conejo:"Conejo", hamster:"Hamster", ave:"Ave", reptil:"Reptil", otro:"Otro" };
        const { data: sp } = await sb.from("species").select("id").eq("name", specMap[form.species]||form.species).single();
        let speciesId = sp?.id || null;
        if (!speciesId) { const { data: ns } = await sb.from("species").insert({ name: specMap[form.species]||form.species }).select("id").single(); speciesId = ns?.id || null; }
        const np = form.owner_name.trim().split(" ");
        const { data: cl, error: ce } = await sb.from("clients").insert({ organization_id: orgId, first_name: np[0], last_name: np.slice(1).join(" ")||"", phone: form.owner_phone||null, email: form.owner_email||null }).select("id").single();
        if (ce||!cl) { setFormError("Error cliente: "+(ce?.message||"")); setSaving(false); return; }
        const { data: pt, error: pe } = await sb.from("patients").insert({ organization_id: orgId, client_id: cl.id, name: form.pet_name, species_id: speciesId, weight_kg: form.weight?parseFloat(form.weight):null }).select("id").single();
        if (pe||!pt) { setFormError("Error paciente: "+(pe?.message||"")); setSaving(false); return; }
        patientId = pt.id;
      }
      const sympStr = symptomTags.length > 0 ? `Sintomas: ${symptomTags.join(", ")}. ` : "";
      const obs = `Canal: Presencial. ${sympStr}${form.reason}`;
      const emergKeys = ["fractura","sangrado","convulsion","dificultad para respirar","herida"];
      const isEmg = symptomTags.some(s => emergKeys.some(k => s.toLowerCase().includes(k)));
      const { error } = await sb.from("consultations").insert({ organization_id: orgId, patient_id: patientId, type: isEmg?"emergency":form.type, reason: form.reason||symptomTags.join(", ")||null, status: form.status, observations: obs });
      if (error) { setFormError(error.message); setSaving(false); return; }
      setShowForm(false); setForm({ pet_name:"", species:"perro", breed:"", weight:"", age:"", owner_name:"", owner_phone:"", owner_email:"", type:"general", reason:"", status:"waiting" });
      setSymptomTags([]); setSelectedPatient(null); setFormMode("search"); setSaving(false); fetchData();
    } catch(err:any) { setFormError(err.message||"Error"); setSaving(false); }
  }

  async function startAttention(c: ConsultationRow) {
    const sb = createClient();
    await sb.from("consultations").update({ status: "in_progress" }).eq("id", c.id);
    router.push(`/dashboard/consultas/${c.id}`);
  }

  const isFromChatbot = (c: ConsultationRow) => c.observations?.includes("Chatbot") || c.observations?.includes("TRIAGE");
  const isEmergency = (c: ConsultationRow) => c.type === "emergency";
  const getChannel = (c: ConsultationRow): { label: string; icon: string; color: string } => {
    const obs = c.observations || "";
    if (obs.includes("Chatbot") || obs.includes("WhatsApp")) return { label: "WhatsApp", icon: "🤖", color: "bg-violet-100 text-violet-700" };
    if (obs.includes("Llamada") || obs.includes("teléfono")) return { label: "Llamada", icon: "📞", color: "bg-blue-100 text-blue-700" };
    return { label: "Presencial", icon: "🏥", color: "bg-emerald-100 text-emerald-700" };
  };

  // Role permissions
  const canCreateConsulta = ["receptionist", "admin", "owner"].includes(role);
  const canAttend = ["veterinarian", "admin", "owner"].includes(role);
  const canBill = ["receptionist", "admin", "owner"].includes(role);

  // Tab-based filtering — hide billing tab from doctors, hide nothing from admin
  const allTabs = [
    { id: "queue", label: "⏳ Cola", filter: (c: ConsultationRow) => c.status === "waiting" || c.status === "in_progress" },
    { id: "billing", label: "💰 Por Cobrar", filter: (c: ConsultationRow) => c.status === "billed", roles: ["receptionist", "admin", "owner"] },
    { id: "done", label: "✅ Completadas", filter: (c: ConsultationRow) => c.status === "completed" },
  ];
  const tabs = allTabs.filter(t => !t.roles || t.roles.includes(role));
  const activeFilter = tabs.find(t => t.id === activeTab)?.filter || (() => true);
  const filtered = consultations
    .filter(activeFilter)
    .filter(c => !search || c.patient?.name.toLowerCase().includes(search.toLowerCase()) || c.reason?.toLowerCase().includes(search.toLowerCase()));

  // Sort emergencies first in queue
  if (activeTab === "queue") filtered.sort((a, b) => {
    if (a.status === "in_progress" && b.status !== "in_progress") return -1;
    if (b.status === "in_progress" && a.status !== "in_progress") return 1;
    if (isEmergency(a) && !isEmergency(b)) return -1;
    if (isEmergency(b) && !isEmergency(a)) return 1;
    return 0;
  });

  const counts = { queue: consultations.filter(c => c.status === "waiting" || c.status === "in_progress").length, billing: consultations.filter(c => c.status === "billed").length, done: consultations.filter(c => c.status === "completed").length };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Consultas</h1><p className="text-slate-500 text-sm mt-1">{consultations.length} registradas · Auto-actualización cada 15s</p></div>
        {canCreateConsulta && <Button onClick={() => setShowForm(!showForm)}>{showForm ? <><X className="w-4 h-4" />Cancelar</> : <><Plus className="w-4 h-4" />Nueva Consulta</>}</Button>}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
              {counts[t.id as keyof typeof counts] > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${t.id === "billing" ? "bg-red-100 text-red-700" : t.id === "queue" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{counts[t.id as keyof typeof counts]}</span>}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" />
        </div>
      </div>

      {/* New Consultation Form */}
      {showForm && (
        <Card className="animate-slide-down">
          <div className="flex items-center gap-2 mb-5"><div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center"><Stethoscope className="w-4 h-4 text-brand-700" /></div><h3 className="text-lg font-bold text-slate-900">Registrar Nueva Consulta</h3></div>
          <form onSubmit={handleSave} className="space-y-5">
            {/* Search existing patient */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">🔍 Buscar Paciente Existente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Nombre mascota o dueño..." value={patientSearch} onChange={e=>{setPatientSearch(e.target.value);setSelectedPatient(null);}} className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none" />
                {searchResults.length>0&&<div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-10 max-h-40 overflow-y-auto">{searchResults.map(p=>(<button key={p.id} type="button" onClick={()=>{setSelectedPatient(p);setPatientSearch("");}} className="w-full text-left px-4 py-2.5 hover:bg-brand-50 flex items-center gap-3 cursor-pointer border-b border-slate-100 last:border-0"><span className="text-lg">🐾</span><div><p className="text-sm font-semibold text-slate-900">{p.name}</p><p className="text-xs text-slate-500">{p.species?.name||""} · {p.client?.first_name} {p.client?.last_name}</p></div></button>))}</div>}
              </div>
              {selectedPatient&&<div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><span className="text-2xl">🐾</span><div><p className="text-sm font-bold text-emerald-800">{selectedPatient.name}</p><p className="text-xs text-emerald-600">{selectedPatient.species?.name||""} · {selectedPatient.client?.first_name} {selectedPatient.client?.last_name}</p></div></div>
                  <button type="button" onClick={()=>setSelectedPatient(null)} className="px-3 py-1 text-xs font-semibold bg-white border border-emerald-200 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 cursor-pointer transition-all">✕ Cambiar</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white rounded-lg p-2 border border-emerald-100"><span className="text-emerald-500 font-medium">Especie</span><p className="font-semibold text-slate-900">{selectedPatient.species?.name||"—"}</p></div>
                  <div className="bg-white rounded-lg p-2 border border-emerald-100"><span className="text-emerald-500 font-medium">Propietario</span><p className="font-semibold text-slate-900">{selectedPatient.client?.first_name} {selectedPatient.client?.last_name}</p></div>
                  <div className="bg-white rounded-lg p-2 border border-emerald-100"><span className="text-emerald-500 font-medium">Estado</span><p className="font-semibold text-emerald-700">✅ Registrado</p></div>
                  <div className="bg-white rounded-lg p-2 border border-emerald-100"><span className="text-emerald-500 font-medium">Ficha</span><p className="font-semibold text-slate-900">Activa</p></div>
                </div>
              </div>}
              {!selectedPatient&&<button type="button" onClick={()=>setFormMode(formMode==="new"?"search":"new")} className="text-sm font-semibold text-brand-600 hover:text-brand-700 cursor-pointer flex items-center gap-1.5"><Plus className="w-4 h-4" />{formMode==="new"?"Cancelar registro nuevo":"Registrar Paciente Nuevo"}</button>}
            </div>
            {/* New patient fields */}
            {formMode==="new"&&!selectedPatient&&(
              <div className="space-y-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Datos del nuevo paciente</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre Mascota <span className="text-red-500">*</span></label><input value={form.pet_name} onChange={e=>setForm({...form,pet_name:e.target.value})} placeholder="Ej: Max, Luna..." className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Especie <span className="text-red-500">*</span></label><select value={form.species} onChange={e=>setForm({...form,species:e.target.value})} className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none bg-white"><option value="perro">🐕 Perro</option><option value="gato">🐈 Gato</option><option value="conejo">🐰 Conejo</option><option value="hamster">🐹 Hámster</option><option value="ave">🦜 Ave</option><option value="reptil">🦎 Reptil</option><option value="otro">Otro</option></select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Raza</label><input value={form.breed} onChange={e=>setForm({...form,breed:e.target.value})} placeholder="Labrador, Siamés..." className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label><input type="number" step="0.1" value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})} placeholder="15" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Edad</label><input value={form.age} onChange={e=>setForm({...form,age:e.target.value})} placeholder="3 años" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none" /></div>
                </div>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mt-2">Datos del propietario</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Propietario <span className="text-red-500">*</span></label><input value={form.owner_name} onChange={e=>setForm({...form,owner_name:e.target.value})} placeholder="Nombre del dueño" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label><input value={form.owner_phone} onChange={e=>setForm({...form,owner_phone:e.target.value})} placeholder="+56 9 1234 5678" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input value={form.owner_email} onChange={e=>setForm({...form,owner_email:e.target.value})} placeholder="correo@ejemplo.cl" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none" /></div>
                </div>
              </div>
            )}
            {/* Consultation details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Consulta</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none bg-white">{Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Estado</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none bg-white"><option value="waiting">En Espera</option><option value="in_progress">En Atención</option></select></div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Motivo de Consulta</label><textarea value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="Descripción breve del motivo..." rows={2} className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none resize-none" /></div>
            {/* Symptoms */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Síntomas Observados</label>
              <div className="relative">
                <input type="text" value={symptomInput} onChange={e=>setSymptomInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();if(symptomInput.trim()){setSymptomTags([...symptomTags,symptomInput.trim()]);setSymptomInput("");}}}} placeholder="Escriba para buscar síntomas (ej: vomit, fiebre...)" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none" />
                {filteredSymptoms.length>0&&<div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-10 max-h-48 overflow-y-auto">{filteredSymptoms.map(s=>{const cat=SYMPTOMS_DB.find(c=>c.items.includes(s));return <button key={s} type="button" onClick={()=>{setSymptomTags([...symptomTags,s]);setSymptomInput("");}} className="w-full text-left px-4 py-2 text-sm hover:bg-brand-50 cursor-pointer border-b border-slate-100 last:border-0 flex items-center justify-between"><span>{s}</span>{cat&&<span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">{cat.cat}</span>}</button>})}</div>}
              </div>
              <p className="text-xs text-slate-400">💡 Escriba al menos 2 letras para sugerencias. Enter para agregar.</p>
              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {symptomTags.length===0&&<span className="text-xs text-slate-400 italic">Los síntomas aparecerán aquí...</span>}
                {symptomTags.map(s=><span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold">{s}<button type="button" onClick={()=>setSymptomTags(symptomTags.filter(t=>t!==s))} className="hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button></span>)}
              </div>
            </div>
            {formError&&<p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">✕ {formError}</p>}
            <Button type="submit" disabled={saving} className="w-full">{saving?<><Loader2 className="w-4 h-4 animate-spin" />Registrando...</>:<>✅ Registrar y Crear Consulta</>}</Button>
          </form>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><div className="text-center py-12 text-slate-400"><Stethoscope className="w-14 h-14 mx-auto mb-3 opacity-30" /><p className="text-sm">{activeTab === "billing" ? "No hay consultas por cobrar" : activeTab === "done" ? "No hay consultas completadas" : "No hay pacientes en cola"}</p></div></Card>
      ) : (
        <div className="space-y-3">
          {(() => { let firstWaitingDone = false; return filtered.map(c => {
            const sc = STATUS_CFG[c.status] || STATUS_CFG.waiting;
            const chatbot = isFromChatbot(c);
            const emergency = isEmergency(c);
            const isFirstWaiting = c.status === "waiting" && !firstWaitingDone;
            if (isFirstWaiting) firstWaitingDone = true;
            return (
              <div key={c.id} className={`rounded-2xl border-2 p-4 transition-all ${
                c.status === "billed" ? "bg-green-50 border-green-200 border-l-green-500 border-l-4" :
                emergency ? "bg-red-50 border-red-200 border-l-red-500 border-l-4" :
                chatbot ? "bg-amber-50 border-amber-200 border-l-violet-500 border-l-4" :
                c.status === "in_progress" ? "bg-blue-50 border-blue-200 border-l-blue-500 border-l-4" :
                "bg-white border-slate-100 hover:border-brand-200"
              } ${emergency && c.status === "waiting" ? "animate-pulse" : ""}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    c.status === "billed" ? "bg-green-100" : emergency ? "bg-red-100" :
                    c.status === "waiting" ? "bg-amber-100" : c.status === "completed" ? "bg-emerald-100" : "bg-blue-100"
                  }`}>
                    <sc.icon className={`w-5 h-5 ${
                      c.status === "billed" ? "text-green-600" : emergency ? "text-red-600" :
                      c.status === "waiting" ? "text-amber-600" : c.status === "completed" ? "text-emerald-600" : "text-blue-600"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{c.patient?.name || "—"}</span>
                      <Badge variant={sc.variant} size="sm">{sc.label}</Badge>
                      <Badge size="sm" variant={emergency ? "danger" : "default"}>{TYPE_LABELS[c.type] || c.type}</Badge>
                      {(() => { const ch = getChannel(c); return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${ch.color}`}>
                          {ch.icon} {ch.label}
                        </span>
                      ); })()}
                    </div>
                    {c.patient && (
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                        <span>🐾 {c.patient.species?.name || "—"} · {c.patient.breeds?.name || "—"}</span>
                        <span>👤 {c.patient.client?.first_name} {c.patient.client?.last_name}</span>
                        {c.patient.client?.phone && <span>📞 {c.patient.client.phone}</span>}
                      </div>
                    )}
                    <p className="text-sm text-slate-600 mt-1 truncate">{c.reason || "Sin motivo"}</p>
                    {c.diagnosis && <p className="text-sm text-emerald-700 mt-1 font-medium truncate">✅ {c.diagnosis.split("\n")[0]}</p>}
                    <p className="text-[11px] text-slate-400 mt-1">{new Date(c.consultation_date).toLocaleString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    {c.status === "waiting" && canAttend && (
                      <button
                        data-tour={isFirstWaiting ? "atender" : undefined}
                        onClick={() => startAttention(c)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 ${emergency ? "bg-red-600 hover:bg-red-700 text-white" : "bg-brand-600 hover:bg-brand-700 text-white"}`}
                      >
                        🩺 Atender
                      </button>
                    )}
                    {c.status === "in_progress" && (
                      <button onClick={() => router.push(`/dashboard/consultas/${c.id}`)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md">
                        📋 Continuar Atención
                      </button>
                    )}
                    {c.status === "billed" && canBill && (
                      <button onClick={() => setBillingConsulta(c)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5">
                        💰 Cobrar
                      </button>
                    )}
                    {(c.status === "billed" || c.status === "completed") && (
                      <button onClick={() => {
                        const p = c.patient;
                        const w = window.open("", "_blank");
                        if (w) {
                          const cleanObs = (c.observations || "").split("---MEDS_JSON---")[0].trim();
                          w.document.write(`<html><head><title>Receta</title></head><body style="font-family:Arial;max-width:600px;margin:20px auto;padding:20px">
                            <h1 style="color:#0891b2;text-align:center">🏥 Veterinaria - DP Sistemas</h1><p style="text-align:center">RECETA MÉDICA</p><hr>
                            <p><b>Paciente:</b> ${p?.name} (${p?.species?.name||""})</p>
                            <p><b>Propietario:</b> ${p?.client?.first_name} ${p?.client?.last_name}</p>
                            <p><b>Diagnóstico:</b> ${c.diagnosis||"N/A"}</p>
                            <p><b>Tratamiento:</b></p><pre style="white-space:pre-wrap;font-family:inherit">${c.treatment||"—"}</pre>
                            ${cleanObs?`<p><b>Observaciones:</b> ${cleanObs}</p>`:""}
                            <script>setTimeout(()=>window.print(),300)<\/script></body></html>`);
                          w.document.close();
                        }
                      }} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer">
                        📄 Receta
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }); })()}
        </div>
      )}

      {/* Billing Modal */}
      {billingConsulta && (
        <BillingModal
          consulta={billingConsulta}
          onClose={() => setBillingConsulta(null)}
          onComplete={() => { setBillingConsulta(null); fetchData(); }}
        />
      )}
    </div>
  );
}
