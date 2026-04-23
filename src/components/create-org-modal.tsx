"use client";

import { useState } from "react";
import { Building2, X, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface CreateOrgModalProps {
  onClose: () => void;
}

export function CreateOrgModal({ onClose }: CreateOrgModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [rut, setRut] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(val: string) {
    setName(val);
    // Auto-generate slug from name
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 30)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setLoading(true);
    setError("");

    const supabase = createClient();

    // Create the organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        rut: rut.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
      })
      .select("id")
      .single();

    if (orgError) {
      setError(orgError.message.includes("unique") ? "Este slug ya existe. Elige otro." : orgError.message);
      setLoading(false);
      return;
    }

    // Add current user as owner
    const { error: memberError } = await supabase.from("organization_members").insert({
      organization_id: org.id,
      user_id: user!.id,
      role: "owner",
    });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    // Reload to pick up the new org
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Nueva Organización</h3>
              <p className="text-xs text-slate-500">Configura tu clínica veterinaria</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nombre de la Clínica *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Clínica Veterinaria El Roble"
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Slug (URL) *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">vet.dpsistemas.cl/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="el-roble"
                className="flex-1 px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">RUT</label>
              <input
                type="text"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="76.123.456-7"
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Ciudad</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Santiago"
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              ✕ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !slug.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all shadow-md shadow-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                Crear Organización
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
