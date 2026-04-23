"use client";

import { useEffect, useState } from "react";
import { PawPrint, Plus, Search, X, Loader2, User, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface PatientRow {
  id: string; name: string; species_id: string; breed_id: string; sex: string;
  date_of_birth: string; weight_kg: number; color: string; microchip: string;
  notes: string; created_at: string;
  species: { name: string } | null;
  breeds: { name: string } | null;
  client: { id: string; first_name: string; last_name: string; phone: string; email: string } | null;
}

const SPECIES_EMOJI: Record<string, string> = { Canino: "🐕", Felino: "🐈", Ave: "🐦", Reptil: "🦎", Roedor: "🐹", Equino: "🐴", Bovino: "🐂", Otro: "🐾" };

export default function PacientesPage() {
  const { currentOrg } = useAuth();
  const role = currentOrg?.role || "viewer";
  const canCreate = ["receptionist", "admin", "owner"].includes(role);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [species, setSpecies] = useState<{ id: string; name: string }[]>([]);
  const [breeds, setBreeds] = useState<{ id: string; name: string; species_id: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([]);

  // Form state
  const [form, setForm] = useState({ name: "", species_id: "", breed_id: "", sex: "unknown", date_of_birth: "", weight_kg: "", color: "", client_id: "", notes: "" });
  const [newClient, setNewClient] = useState({ first_name: "", last_name: "", phone: "", email: "" });
  const [showNewClient, setShowNewClient] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!currentOrg) return;
    fetchData();
  }, [currentOrg]);

  async function fetchData() {
    const sb = createClient();
    const orgId = currentOrg!.organization_id;

    const [pRes, sRes, bRes, cRes] = await Promise.all([
      sb.from("patients").select("*, species:species(name), breeds:breeds(name), client:clients(id, first_name, last_name, phone, email)").eq("organization_id", orgId).order("created_at", { ascending: false }),
      sb.from("species").select("id, name").order("name"),
      sb.from("breeds").select("id, name, species_id").order("name"),
      sb.from("clients").select("id, first_name, last_name").eq("organization_id", orgId).order("last_name"),
    ]);

    setPatients((pRes.data || []) as unknown as PatientRow[]);
    setSpecies(sRes.data || []);
    setBreeds(bRes.data || []);
    setClients(cRes.data || []);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.species_id) { setFormError("Nombre y especie son requeridos"); return; }
    setSaving(true); setFormError("");
    const sb = createClient();
    const orgId = currentOrg!.organization_id;
    let clientId = form.client_id;

    // Create new client if needed
    if (showNewClient && newClient.first_name && newClient.last_name) {
      const { data: cl, error: clErr } = await sb.from("clients").insert({ organization_id: orgId, first_name: newClient.first_name, last_name: newClient.last_name, phone: newClient.phone, email: newClient.email }).select("id").single();
      if (clErr) { setFormError(clErr.message); setSaving(false); return; }
      clientId = cl.id;
    }

    if (!clientId) { setFormError("Selecciona o crea un cliente"); setSaving(false); return; }

    const { error } = await sb.from("patients").insert({
      organization_id: orgId, name: form.name, species_id: form.species_id,
      breed_id: form.breed_id || null, sex: form.sex, date_of_birth: form.date_of_birth || null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null, color: form.color || null,
      client_id: clientId, notes: form.notes || null,
    });

    if (error) { setFormError(error.message); setSaving(false); return; }
    setShowForm(false);
    setForm({ name: "", species_id: "", breed_id: "", sex: "unknown", date_of_birth: "", weight_kg: "", color: "", client_id: "", notes: "" });
    setNewClient({ first_name: "", last_name: "", phone: "", email: "" });
    setShowNewClient(false);
    setSaving(false);
    fetchData();
  }

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.client?.first_name.toLowerCase().includes(search.toLowerCase()) || p.client?.last_name.toLowerCase().includes(search.toLowerCase()));
  const filteredBreeds = breeds.filter((b) => b.species_id === form.species_id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Pacientes</h1><p className="text-slate-500 text-sm mt-1">{patients.length} pacientes registrados</p></div>
        {canCreate && <Button onClick={() => setShowForm(!showForm)}>{showForm ? <><X className="w-4 h-4" />Cancelar</> : <><Plus className="w-4 h-4" />Nuevo Paciente</>}</Button>}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Buscar por nombre, dueño..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all" />
      </div>

      {/* New Patient Form */}
      {showForm && canCreate && (
        <Card className="animate-slide-down">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Registrar Paciente</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Max" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Especie *</label><select value={form.species_id} onChange={(e) => setForm({ ...form, species_id: e.target.value, breed_id: "" })} className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" required><option value="">Seleccionar...</option>{species.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Raza</label><select value={form.breed_id} onChange={(e) => setForm({ ...form, breed_id: e.target.value })} className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all"><option value="">Seleccionar...</option>{filteredBreeds.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Sexo</label><select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all"><option value="unknown">Desconocido</option><option value="male">Macho</option><option value="female">Hembra</option></select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nacimiento</label><input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label><input type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} placeholder="12.5" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Color</label><input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Dorado" className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" /></div>
            </div>

            {/* Client selection */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-700">Dueño / Cliente</h4>
                <button type="button" onClick={() => setShowNewClient(!showNewClient)} className="text-xs text-brand-600 font-semibold hover:text-brand-700 cursor-pointer">{showNewClient ? "Seleccionar existente" : "+ Nuevo cliente"}</button>
              </div>
              {showNewClient ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input value={newClient.first_name} onChange={(e) => setNewClient({ ...newClient, first_name: e.target.value })} placeholder="Nombre *" className="px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" required />
                  <input value={newClient.last_name} onChange={(e) => setNewClient({ ...newClient, last_name: e.target.value })} placeholder="Apellido *" className="px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" required />
                  <input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} placeholder="Teléfono" className="px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" />
                  <input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder="Email" className="px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all" />
                </div>
              ) : (
                <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 outline-none transition-all">
                  <option value="">Seleccionar cliente...</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
              )}
            </div>

            {formError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">✕ {formError}</p>}
            <Button type="submit" disabled={saving}>{saving ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : <><PawPrint className="w-4 h-4" />Registrar Paciente</>}</Button>
          </form>
        </Card>
      )}

      {/* Patient List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><div className="text-center py-12 text-slate-400"><PawPrint className="w-14 h-14 mx-auto mb-3 opacity-30" /><p className="text-sm">{search ? "Sin resultados" : "No hay pacientes. ¡Registra el primero!"}</p></div></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <Card key={p.id} hover padding="md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-2xl shrink-0">{SPECIES_EMOJI[p.species?.name || "Otro"] || "🐾"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{p.name}</span>
                    <Badge variant="brand" size="sm">{p.species?.name || "—"}</Badge>
                    {p.breeds?.name && <Badge size="sm">{p.breeds.name}</Badge>}
                    {p.sex === "male" ? <span className="text-xs">♂️</span> : p.sex === "female" ? <span className="text-xs">♀️</span> : null}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                    {p.client && <span className="flex items-center gap-1"><User className="w-3 h-3" />{p.client.first_name} {p.client.last_name}</span>}
                    {p.client?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.client.phone}</span>}
                    {p.weight_kg && <span>{p.weight_kg} kg</span>}
                    {p.color && <span>{p.color}</span>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
