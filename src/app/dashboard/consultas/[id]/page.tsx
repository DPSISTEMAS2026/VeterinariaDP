"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, PawPrint, User, Phone, Stethoscope, Plus, X, RefreshCw, Pill, FileText, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Bot, Scale, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { runTriage, type TriageResult } from "@/lib/triage-engine";

/* ── All known symptoms for autocomplete ── */
const ALL_SYMPTOMS = [
  "fiebre alta","secrecion nasal","tos seca","perdida de apetito","vomitos","diarrea","convulsiones","temblores","paralisis",
  "rascado orejas","sacude cabeza","mal olor oido","secrecion oido","dolor orejas","inflamacion oreja","inclinacion cabeza",
  "deshidratacion","dolor abdominal","letargia","flatulencias","diarrea sangre","diarrea hemorragica","deshidratacion severa",
  "picazon","se rasca","prurito","lamido patas","enrojecimiento piel","perdida pelo","alopecia","costras","piel irritada",
  "sed excesiva","orina mucho","perdida peso","mal aliento","pelaje opaco","orina frecuente","esfuerzo orinar","sangre orina",
  "dolor orinar","lamido genitales","orina turbia","incontinencia","cojera trasera","dificultad levantarse","dificultad escaleras",
  "atrofia muscular","rigidez","apetito aumentado","cataratas","debilidad patas","orina fuera caja","maulla orinar",
  "estornudos","secrecion ocular","conjuntivitis","salivacion","cojera severa","no apoya pata","dolor intenso","deformidad",
  "gime dolor","no camina","abdomen hinchado","dificultad respirar","colapso","arcadas sin vomito","postura oracion",
  "movimientos involuntarios","perdida consciencia","rigidez muscular","desorientacion","encias rojas","encias sangrantes",
  "sarro","dientes flojos","dolor comer","rechazo comida","fiebre","inflamacion","vomitos severos","letargia extrema",
];

/* ── Diagnosis → Recommended medication keywords + treatment ── */
const DIAG_MED_MAP: Record<string, { keywords: string[]; categories: string[]; treatment: string }> = {
  "Moquillo Canino": { keywords: ["amoxicilina","metronidazol","dipirona","suero","vitamina"], categories: ["Antibioticos","Antiinflamatorios","Analgesicos"], treatment: "1. Fluidoterapia IV para rehidratación\n2. Antibióticos (Amoxicilina 20mg/kg c/12h x 10 días)\n3. Antipiréticos (Dipirona 25mg/kg c/8h)\n4. Soporte nutricional\n5. Control en 48 horas" },
  "Otitis Externa": { keywords: ["otológ","ótico","otico","gentamicina","dexametasona","limpiador"], categories: ["Oticos","Antibioticos"], treatment: "1. Limpieza ótica con solución fisiológica\n2. Gotas óticas antibióticas + corticoide (c/12h x 10 días)\n3. Control en 7 días\n4. Evitar humedad en oídos" },
  "Gastroenteritis": { keywords: ["metronidazol","omeprazol","ondansetron","suero","probiótico","probiotico"], categories: ["Gastrointestinales","Antibioticos"], treatment: "1. Dieta blanda (pollo hervido + arroz) por 5 días\n2. Omeprazol 1mg/kg c/24h\n3. Metronidazol 15mg/kg c/12h x 7 días\n4. Hidratación oral o SC si deshidratado\n5. Control en 3 días" },
  "Parvovirus Canino": { keywords: ["suero","metronidazol","ceftriaxona","ondansetron","ranitidina"], categories: ["Antibioticos","Gastrointestinales"], treatment: "⚠️ HOSPITALIZACIÓN REQUERIDA\n1. Fluidoterapia IV agresiva\n2. Antibióticos IV (Ceftriaxona 30mg/kg c/12h)\n3. Antieméticos (Ondansetrón 0.5mg/kg IV c/8h)\n4. Nada por vía oral hasta estabilización\n5. Monitoreo cada 4 horas" },
  "Dermatitis Alérgica": { keywords: ["prednisolona","antihistamínico","antihistaminico","clorfenamina","shampoo","baño"], categories: ["Dermatologicos","Antiinflamatorios"], treatment: "1. Baño medicado con shampoo clorhexidina 2x/semana\n2. Prednisolona 1mg/kg c/24h x 5 días, luego reducir\n3. Antihistamínico oral si prurito persiste\n4. Control de pulgas estricto\n5. Evaluar dieta hipoalergénica" },
  "Insuficiencia Renal": { keywords: ["suero","omeprazol","ranitidina","eritropoyetina","fosfato"], categories: ["Gastrointestinales"], treatment: "1. Fluidoterapia SC 100-150ml/día\n2. Dieta renal baja en fósforo y proteína\n3. Protector gástrico (Omeprazol 1mg/kg c/24h)\n4. Control de presión arterial\n5. Hemograma + perfil renal en 7 días" },
  "Cistitis": { keywords: ["amoxicilina","enrofloxacina","meloxicam","cranberry"], categories: ["Antibioticos","Antiinflamatorios"], treatment: "1. Antibiótico (Amoxicilina+Ac.Clavulánico 20mg/kg c/12h x 10 días)\n2. Meloxicam 0.1mg/kg c/24h x 3 días (analgesia)\n3. Aumentar ingesta de agua\n4. Dieta urinaria\n5. Urocultivo control en 14 días" },
  "Displasia de Cadera": { keywords: ["meloxicam","condroitina","glucosamina","tramadol","carprofeno"], categories: ["Antiinflamatorios","Analgesicos"], treatment: "1. AINE (Meloxicam 0.1mg/kg c/24h)\n2. Condroprotector (Glucosamina+Condroitina diario)\n3. Control de peso estricto\n4. Ejercicio controlado (caminatas cortas, natación)\n5. Evaluación radiográfica en 3 meses" },
  "Diabetes Mellitus": { keywords: ["insulina","jeringa","glucómetro","glucometro"], categories: [], treatment: "1. Insulina NPH 0.25-0.5 UI/kg c/12h SC\n2. Dieta alta en fibra, baja en carbohidratos\n3. Curva de glucosa en 7 días\n4. Control de peso\n5. Educación al propietario sobre aplicación" },
  "FLUTD": { keywords: ["meloxicam","prazosin","amoxicilina","dieta urinaria"], categories: ["Antibioticos","Antiinflamatorios"], treatment: "⚠️ Verificar obstrucción uretral\n1. Cateterización si hay obstrucción\n2. Fluidoterapia IV\n3. Analgesia (Meloxicam 0.1mg/kg)\n4. Dieta urinaria húmeda permanente\n5. Enriquecer ambiente (reducir estrés)" },
  "Fractura": { keywords: ["tramadol","meloxicam","carprofeno","ceftriaxona"], categories: ["Analgesicos","Antiinflamatorios","Antibioticos"], treatment: "⚠️ RADIOGRAFÍA URGENTE\n1. Analgesia inmediata (Tramadol 3-5mg/kg c/8h)\n2. Antiinflamatorio (Meloxicam 0.1mg/kg c/24h)\n3. Inmovilización temporal\n4. Evaluación quirúrgica\n5. Antibiótico profiláctico si fractura abierta\n6. Reposo absoluto" },
  "Torsión Gástrica": { keywords: ["suero","tramadol","metoclopramida"], categories: ["Analgesicos","Gastrointestinales"], treatment: "🚨 EMERGENCIA QUIRÚRGICA\n1. Estabilización hemodinámica IV\n2. Descompresión gástrica\n3. Cirugía de emergencia (gastropexia)\n4. Monitoreo cardíaco post-op\n5. UCI 24-48 horas" },
  "Pancreatitis": { keywords: ["omeprazol","ondansetron","tramadol","suero","maropitant"], categories: ["Gastrointestinales","Analgesicos"], treatment: "1. Hospitalización y fluidoterapia IV\n2. Ayuno 24-48h, luego dieta baja en grasa\n3. Analgesia (Tramadol 3mg/kg c/8h)\n4. Antiemético (Maropitant 1mg/kg c/24h)\n5. Perfil pancreático control en 5 días" },
  "Epilepsia": { keywords: ["fenobarbital","diazepam","levetiracetam"], categories: [], treatment: "1. Fenobarbital 2.5mg/kg c/12h VO\n2. Monitoreo de convulsiones (diario del propietario)\n3. Niveles séricos de fenobarbital en 14 días\n4. Perfil hepático mensual\n5. NO suspender medicación abruptamente" },
  "Enfermedad Periodontal": { keywords: ["amoxicilina","metronidazol","clorhexidina","meloxicam"], categories: ["Antibioticos","Antiinflamatorios"], treatment: "1. Profilaxis dental bajo anestesia\n2. Extracciones de piezas comprometidas\n3. Antibiótico (Amoxicilina+Metronidazol x 7 días)\n4. Enjuague con Clorhexidina 0.12%\n5. Dieta dental + cepillado regular" },
  "Rinotraqueitis Viral Felina": { keywords: ["amoxicilina","doxiciclina","lisina","suero fisiológico"], categories: ["Antibioticos"], treatment: "1. Antibiótico (Doxiciclina 10mg/kg c/24h x 14 días)\n2. L-Lisina 500mg c/24h\n3. Limpieza nasal con suero fisiológico\n4. Nebulizaciones si congestión severa\n5. Soporte nutricional (alimento húmedo tibio)" },
};

export default function AttentionPage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrg } = useAuth();
  const consultaId = params.id as string;

  const [consulta, setConsulta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Symptoms
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [symptomSuggestions, setSymptomSuggestions] = useState<string[]>([]);
  // Diagnosis
  const [triageResults, setTriageResults] = useState<TriageResult[]>([]);
  const [selectedDiag, setSelectedDiag] = useState<TriageResult | null>(null);
  // Medications
  const [medications, setMedications] = useState<any[]>([]);
  const [selectedMeds, setSelectedMeds] = useState<any[]>([]);
  const [medSearch, setMedSearch] = useState("");
  const [recommendedMeds, setRecommendedMeds] = useState<any[]>([]);
  // Treatment
  const [treatment, setTreatment] = useState("");
  const [observations, setObservations] = useState("");
  const [weight, setWeight] = useState("");
  // Accordions
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ symptoms: true, diagnosis: true, meds: false, treatment: true });
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Track whether initial data has loaded to avoid overwriting user edits
  const initialLoadDone = useRef(false);

  const fetchConsulta = useCallback(async () => {
    if (!currentOrg) return;
    const sb = createClient();
    const { data } = await sb.from("consultations")
      .select("*, patient:patients(id, name, weight_kg, sex, color, notes, species:species(name), breeds:breeds(name), client:clients(first_name, last_name, phone, email))")
      .eq("id", consultaId).single();
    if (data) {
      setConsulta(data);
      // Only set these fields on the FIRST load — never overwrite user edits
      if (!initialLoadDone.current) {
        setWeight(data.patient?.weight_kg?.toString() || "");
        setTreatment(data.treatment || "");
        // Strip out MEDS_JSON block from observations for display
        const rawObs = data.observations || "";
        const cleanObs = rawObs.split("---MEDS_JSON---")[0].trim();
        setObservations(cleanObs);
        // Extract symptoms from reason/observations
        const existingSymptoms: string[] = [];
        const textToScan = `${data.reason || ""} ${rawObs}`.toLowerCase();
        ALL_SYMPTOMS.forEach(s => { if (textToScan.includes(s.toLowerCase())) existingSymptoms.push(s); });
        if (existingSymptoms.length > 0) setSymptoms(existingSymptoms);
        initialLoadDone.current = true;
      }
    }
    // Fetch inventory WITH category name via join
    const { data: meds } = await sb.from("inventory")
      .select("id, name, sku, stock_quantity, sale_price, category:inventory_categories(name)")
      .eq("organization_id", currentOrg.organization_id)
      .order("name");
    // Flatten the category join: { category: { name: "X" } } → { category: "X" }
    const flatMeds = (meds || []).map((m: any) => ({
      ...m,
      category: m.category?.name || "Sin categoría",
    }));
    setMedications(flatMeds);
    setLoading(false);
  }, [consultaId, currentOrg]);

  useEffect(() => { fetchConsulta(); }, [fetchConsulta]);

  // Auto-run triage when symptoms change
  useEffect(() => {
    if (symptoms.length > 0 && consulta?.patient) {
      const species = consulta.patient.species?.name || "Perro";
      const results = runTriage(species, symptoms);
      setTriageResults(results);
    }
  }, [symptoms, consulta]);

  function addSymptom(s: string) {
    const clean = s.trim().toLowerCase();
    if (clean && !symptoms.includes(clean)) setSymptoms(prev => [...prev, clean]);
    setSymptomInput(""); setSymptomSuggestions([]);
  }

  function removeSymptom(s: string) { setSymptoms(prev => prev.filter(x => x !== s)); }

  function handleSymptomInput(val: string) {
    setSymptomInput(val);
    if (val.length >= 2) {
      const matches = ALL_SYMPTOMS.filter(s => s.includes(val.toLowerCase()) && !symptoms.includes(s)).slice(0, 8);
      setSymptomSuggestions(matches);
    } else setSymptomSuggestions([]);
  }

  function selectDiagnosis(d: TriageResult | null) {
    if (!d || selectedDiag?.condition === d.condition) {
      setSelectedDiag(null);
      setRecommendedMeds([]);
      return;
    }
    setSelectedDiag(d);
    // Auto-fill treatment
    const mapping = DIAG_MED_MAP[d.condition];
    if (mapping) {
      setTreatment(mapping.treatment);
      // Find recommended medications from inventory — ONLY by keyword (specific names),
      // NOT by broad category to avoid loading 10+ unrelated medications
      const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const recs = medications.filter(m => {
        const mName = norm(m.name);
        return mapping.keywords.some(kw => mName.includes(norm(kw)));
      });
      setRecommendedMeds(recs);
      // Auto-select max 3 recommended meds that have stock (like the original project)
      const toSelect = recs
        .filter(r => r.stock_quantity > 0 && !selectedMeds.find(s => s.id === r.id))
        .slice(0, 3);
      setSelectedMeds(prev => [...prev, ...toSelect.map(m => ({ ...m, dosage: "" }))]);
    }
    // Open meds and treatment sections
    setOpenSections(prev => ({ ...prev, meds: true, treatment: true }));
  }

  function toggleMed(med: any) {
    setSelectedMeds(prev => prev.find(m => m.id === med.id) ? prev.filter(m => m.id !== med.id) : [...prev, { ...med, dosage: "" }]);
  }

  const isRecommended = (m: any) => recommendedMeds.some(r => r.id === m.id);

  const filteredMeds = medications.filter(m =>
    !medSearch || m.name.toLowerCase().includes(medSearch.toLowerCase()) || m.category?.toLowerCase().includes(medSearch.toLowerCase())
  );
  // Sort: recommended first
  const sortedMeds = [...filteredMeds].sort((a, b) => {
    const aRec = isRecommended(a) ? 0 : 1;
    const bRec = isRecommended(b) ? 0 : 1;
    return aRec - bRec;
  });

  async function handleSave(complete: boolean) {
    if (!consulta) return;
    setSaving(true);
    const sb = createClient();
    const diagText = selectedDiag ? selectedDiag.condition : triageResults[0]?.condition || "";
    const medsText = selectedMeds.map(m => `${m.name}${m.dosage ? ` — ${m.dosage}` : ""}`).join("; ");
    const fullDiagnosis = `${diagText}${medsText ? `\nMedicamentos: ${medsText}` : ""}`;

    // Build medication data for billing
    const medsData = selectedMeds.map(m => ({
      id: m.id, name: m.name, category: m.category,
      dosage: m.dosage, sale_price: m.sale_price, quantity: 1,
    }));

    // When complete: status = "billed" (goes to reception for billing)
    const obsWithMeds = complete
      ? `${observations || ""}\n---MEDS_JSON---\n${JSON.stringify(medsData)}`
      : observations || null;

    await sb.from("consultations").update({
      status: complete ? "billed" : "in_progress",
      diagnosis: fullDiagnosis || null,
      treatment: treatment || null,
      observations: obsWithMeds,
    }).eq("id", consulta.id);

    if (weight && consulta.patient) {
      await sb.from("patients").update({ weight_kg: parseFloat(weight) }).eq("id", consulta.patient.id);
    }
    setSaving(false);
    if (complete) router.push("/dashboard/consultas");
    // Don't re-fetch after save — it would overwrite user's edits
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  if (!consulta) return <div className="text-center py-20 text-slate-400">Consulta no encontrada</div>;

  const isEmergency = consulta.type === "emergency";
  const p = consulta.patient;

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/consultas")} className="p-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              🩺 Atención en Curso
              {isEmergency && <Badge variant="danger">🚨 EMERGENCIA</Badge>}
              {consulta.observations?.includes("Chatbot") && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded-full"><Bot className="w-3 h-3" />CHATBOT</span>}
            </h1>
            <p className="text-sm text-slate-500">{p?.name} · {new Date(consulta.consultation_date).toLocaleString("es-CL")}</p>
          </div>
        </div>
      </div>

      {/* ── PATIENT INFO ── */}
      <div className={`rounded-2xl p-5 border-2 ${isEmergency ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><PawPrint className="w-4 h-4 text-brand-600" />Datos del Paciente</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoBox label="Paciente" value={`🐾 ${p?.name}`} />
          <InfoBox label="Especie / Raza" value={`${p?.species?.name || "—"} · ${p?.breeds?.name || "—"}`} />
          <InfoBox label="Sexo" value={p?.sex === "male" ? "Macho ♂️" : "Hembra ♀️"} />
          <InfoBox label="Color" value={p?.color || "—"} />
          <InfoBox label="Propietario" value={`👤 ${p?.client?.first_name} ${p?.client?.last_name}`} />
          <InfoBox label="Teléfono" value={`📞 ${p?.client?.phone || "—"}`} />
          <InfoBox label="Email" value={p?.client?.email || "—"} />
          <InfoBox label="Motivo" value={consulta.reason || "Consulta general"} highlight />
        </div>
        {p?.notes && <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">⚠️ <strong>Alerta:</strong> {p.notes}</div>}
      </div>

      {/* ── WEIGHT ── */}
      <div className="bg-cyan-50 border-2 border-cyan-200 rounded-2xl p-4">
        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><Scale className="w-4 h-4" />Peso del Paciente</h4>
        <div className="flex items-center gap-4 flex-wrap">
          <div><span className="text-sm text-slate-500">Registrado:</span> <strong className="text-slate-900">{p?.weight_kg ? `${p.weight_kg} kg` : "N/A"}</strong></div>
          <div className="flex items-center gap-2">
            <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Nuevo peso (kg)" className="w-32 px-3 py-2 text-sm rounded-xl border-2 border-cyan-300 focus:border-brand-500 outline-none" />
            <span className="text-sm text-slate-500">kg</span>
          </div>
        </div>
      </div>

      {/* ── SYMPTOMS ── */}
      <Accordion title="📋 Síntomas" count={symptoms.length} open={openSections.symptoms} onToggle={() => toggle("symptoms")} dataTour="symptoms">
        {/* Reported symptoms tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {symptoms.map(s => (
            <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-800 text-xs font-medium rounded-full border border-brand-200">
              {s}
              <button onClick={() => removeSymptom(s)} className="hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {symptoms.length === 0 && <p className="text-sm text-slate-400 italic">Sin síntomas reportados</p>}
        </div>
        {/* Add symptom */}
        <div className="relative">
          <div className="flex gap-2">
            <input type="text" value={symptomInput} onChange={e => handleSymptomInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && symptomInput) { e.preventDefault(); addSymptom(symptomInput); } }} placeholder="Escribir síntoma..." className="flex-1 px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none" />
            <button onClick={() => symptomInput && addSymptom(symptomInput)} className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 cursor-pointer"><Plus className="w-4 h-4" /></button>
          </div>
          {symptomSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-12 mt-1 bg-white border-2 border-brand-300 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
              {symptomSuggestions.map(s => (
                <button key={s} onClick={() => addSymptom(s)} className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0">{s}</button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => { if (symptoms.length > 0) { const species = p?.species?.name || "Perro"; setTriageResults(runTriage(species, symptoms)); setOpenSections(prev => ({ ...prev, diagnosis: true })); } }} className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-50 text-brand-700 text-sm font-semibold rounded-xl border border-brand-200 hover:bg-brand-100 transition-all cursor-pointer">
          <RefreshCw className="w-4 h-4" />Recalcular Diagnósticos
        </button>
      </Accordion>

      {/* ── DIAGNOSTICS ── */}
      <Accordion title="🔍 Diagnósticos" count={triageResults.length} open={openSections.diagnosis} onToggle={() => toggle("diagnosis")} dataTour="diagnosis">
        {triageResults.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Agrega síntomas para obtener diagnósticos sugeridos</p>
        ) : (
          <div className="space-y-3">
            {triageResults.map((d, i) => {
              const isSelected = selectedDiag?.condition === d.condition;
              const severityColors: Record<string, string> = { "Crítica": "bg-red-600 text-white", "Alta": "bg-orange-100 text-orange-800", "Moderada": "bg-amber-100 text-amber-800", "Leve": "bg-green-100 text-green-800" };
              return (
                <div key={d.condition} data-tour={i === 0 ? "first-diagnosis" : undefined} onClick={() => selectDiagnosis(d)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? "border-brand-500 bg-brand-50 shadow-md ring-2 ring-brand-200" : "border-slate-200 hover:border-brand-300"}`}>
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {isSelected && <CheckCircle className="w-5 h-5 text-brand-600 shrink-0" />}
                      <span className="font-bold text-slate-900">{d.condition}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${severityColors[d.severity] || "bg-slate-100"}`}>{d.severity}</span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">{d.matchScore}% match</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{d.description}</p>
                  <p className="text-xs text-slate-500"><strong>Tratamiento sugerido:</strong> {d.treatment}</p>
                  <p className="text-xs text-slate-500"><strong>Urgencia:</strong> {d.urgency}</p>
                  {isSelected && DIAG_MED_MAP[d.condition] && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-xs font-semibold text-emerald-700 mb-1">✅ Diagnóstico seleccionado — Se cargaron medicamentos recomendados y tratamiento</p>
                      <p className="text-[11px] text-emerald-600">Categorías: {DIAG_MED_MAP[d.condition].categories.join(", ") || "General"}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Accordion>

      {/* ── MEDICATIONS ── */}
      <Accordion title="💊 Medicamentos" count={selectedMeds.length} open={openSections.meds} onToggle={() => toggle("meds")} dataTour="medications">
        {/* Recommended banner */}
        {recommendedMeds.length > 0 && (
          <div className="mb-4 p-3 bg-violet-50 border-2 border-violet-200 rounded-xl">
            <p className="text-xs font-bold text-violet-700 uppercase mb-1">🎯 Recomendados para: {selectedDiag?.condition}</p>
            <p className="text-[11px] text-violet-600">{recommendedMeds.length} medicamentos del inventario coinciden con el diagnóstico</p>
          </div>
        )}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={medSearch} onChange={e => setMedSearch(e.target.value)} placeholder="Buscar medicamento..." className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none" />
        </div>
        {/* Selected */}
        {selectedMeds.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-semibold text-emerald-700 uppercase">✅ Medicamentos recetados ({selectedMeds.length}):</p>
            {selectedMeds.map(m => (
              <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isRecommended(m) ? "bg-violet-50 border-violet-200" : "bg-emerald-50 border-emerald-200"}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{m.name}</p>
                    {isRecommended(m) && <span className="px-1.5 py-0.5 bg-violet-200 text-violet-800 text-[9px] font-bold rounded">RECOMENDADO</span>}
                  </div>
                  <p className="text-xs text-slate-500">{m.category} · Stock: {m.stock_quantity} · ${m.sale_price?.toLocaleString("es-CL")}</p>
                </div>
                <input type="text" placeholder="Dosis / indicación" value={m.dosage} onChange={e => setSelectedMeds(prev => prev.map(x => x.id === m.id ? { ...x, dosage: e.target.value } : x))} className="w-48 px-2 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-brand-400" />
                <button onClick={() => toggleMed(m)} className="text-red-500 hover:text-red-700 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
        {/* Available */}
        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Inventario disponible:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {sortedMeds.slice(0, 30).map(m => {
            const isSel = selectedMeds.find(s => s.id === m.id);
            const isRec = isRecommended(m);
            const lowStock = m.stock_quantity <= 5;
            return (
              <div key={m.id} onClick={() => toggleMed(m)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${isSel ? "border-brand-500 bg-brand-50" : isRec ? "border-violet-400 bg-violet-50 shadow-sm" : lowStock ? "border-red-200 bg-red-50" : "border-slate-200 hover:border-brand-300"}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-slate-900">{m.name}</p>
                    {isRec && !isSel && <span className="px-1.5 py-0.5 bg-violet-200 text-violet-800 text-[9px] font-bold rounded">REC</span>}
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${lowStock ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{m.stock_quantity} uds</span>
                </div>
                <p className="text-xs text-slate-500">{m.category} · ${m.sale_price?.toLocaleString("es-CL")}</p>
              </div>
            );
          })}
        </div>
      </Accordion>

      {/* ── TREATMENT ── */}
      <Accordion title="📝 Indicaciones de Tratamiento" open={openSections.treatment} onToggle={() => toggle("treatment")} dataTour="treatment">
        <textarea value={treatment} onChange={e => setTreatment(e.target.value)} placeholder="Escriba las indicaciones para el tratamiento, dosis, frecuencia, duración..." rows={4} className="w-full px-4 py-3 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none resize-none" />
        <textarea value={observations} onChange={e => setObservations(e.target.value)} placeholder="Observaciones adicionales, próximo control..." rows={2} className="w-full mt-3 px-4 py-3 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none resize-none" />
      </Accordion>

      {/* ── ACTIONS ── */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm sticky bottom-4">
        <button onClick={() => router.push("/dashboard/consultas")} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">← Volver</button>
        <div className="flex gap-3">
          <button onClick={() => handleSave(false)} disabled={saving} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-md disabled:opacity-50">💾 Guardar</button>
          <button data-tour="finalize" onClick={() => handleSave(true)} disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all cursor-pointer shadow-md disabled:opacity-50">
            {saving ? "Guardando..." : "✅ Finalizar y Enviar a Cobro"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function InfoBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white rounded-xl p-3 border border-slate-100">
      <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">{label}</p>
      <p className={`text-sm mt-0.5 ${highlight ? "font-semibold text-brand-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function Accordion({ title, count, open, onToggle, children, dataTour }: { title: string; count?: number; open: boolean; onToggle: () => void; children: React.ReactNode; dataTour?: string }) {
  return (
    <div data-tour={dataTour} className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          {title}
          {count !== undefined && <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-bold rounded-full">{count}</span>}
        </h3>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-100 pt-4">{children}</div>}
    </div>
  );
}
