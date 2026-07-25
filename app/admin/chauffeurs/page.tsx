"use client";

import { useEffect, useState, useCallback } from "react";
import { Topbar } from "@/components/admin/topbar";
import { ChauffeurForm } from "@/components/admin/chauffeur-form";
import { useToast } from "@/components/admin/toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Chauffeur {
  id: string;
  nom: string;
  telephone: string;
  vehicule: string;
  immatriculation: string;
  statut: string;
}

const STATUT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  disponible: { bg: "bg-ok/10", text: "text-ok", label: "Disponible" },
  en_course: { bg: "bg-gold/15", text: "text-gold2", label: "En course" },
  indisponible: { bg: "bg-err/10", text: "text-err", label: "Indisponible" },
};

export default function ChauffeursPage() {
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [editing, setEditing] = useState<Chauffeur | null>(null);
  const [adding, setAdding] = useState(false);
  const { show } = useToast();

  const load = useCallback(() => {
    fetch("/api/admin/chauffeurs").then((r) => r.json()).then(setChauffeurs);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(data: any) {
    await fetch("/api/admin/chauffeurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    show("Chauffeur ajouté");
    setAdding(false);
    load();
  }

  async function handleEdit(data: any) {
    if (!editing) return;
    await fetch(`/api/admin/chauffeurs/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    show("Chauffeur mis à jour");
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/chauffeurs/${id}`, { method: "DELETE" });
    show("Chauffeur supprimé");
    load();
  }

  async function handleStatusToggle(c: Chauffeur) {
    const next = c.statut === "disponible" ? "en_course" : c.statut === "en_course" ? "indisponible" : "disponible";
    await fetch(`/api/admin/chauffeurs/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: next }),
    });
    show("Statut mis à jour");
    load();
  }

  return (
    <>
      <Topbar title="Chauffeurs" subtitle={`${chauffeurs.length} chauffeurs`}>
        <button
          onClick={() => setAdding(true)}
          className="bg-ink text-cream rounded-full px-4 py-2 text-[12px] flex items-center gap-1.5 hover:bg-ink2"
        >
          <Plus size={12} /> Ajouter
        </button>
      </Topbar>
      <div className="p-6 lg:p-10">
        <div className="bg-white rounded-2xl border border-line overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="text-[10px] uppercase tracking-[0.18em] text-mute bg-cream/50">
              <tr>
                <th className="text-left font-medium px-5 py-3">Nom</th>
                <th className="text-left font-medium px-5 py-3">Téléphone</th>
                <th className="text-left font-medium px-5 py-3">Véhicule</th>
                <th className="text-left font-medium px-5 py-3">Immatriculation</th>
                <th className="text-left font-medium px-5 py-3">Statut</th>
                <th className="text-right font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {chauffeurs.map((c) => {
                const s = STATUT_STYLES[c.statut] || STATUT_STYLES.disponible;
                return (
                  <tr key={c.id} className="hover:bg-cream/40">
                    <td className="px-5 py-4 text-ink font-medium">{c.nom}</td>
                    <td className="px-5 py-4 text-mute mono">{c.telephone}</td>
                    <td className="px-5 py-4 text-ink">{c.vehicule}</td>
                    <td className="px-5 py-4 text-mute mono">{c.immatriculation}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleStatusToggle(c)}
                        className={`inline-flex items-center gap-1.5 text-[11px] ${s.bg} ${s.text} rounded-full px-2.5 py-1 cursor-pointer`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.text.replace("text-", "bg-")}`} />
                        {s.label}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => setEditing(c)} className="text-mute hover:text-ink"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(c.id)} className="text-mute hover:text-err ml-2"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {adding && <ChauffeurForm onSave={handleAdd} onCancel={() => setAdding(false)} />}
      {editing && <ChauffeurForm initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} />}
    </>
  );
}
