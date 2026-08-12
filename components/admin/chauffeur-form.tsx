"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface ChauffeurFormProps {
  initial?: { id?: string; nom: string; telephone: string; vehicule: string; immatriculation: string; statut: string };
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function ChauffeurForm({ initial, onSave, onCancel }: ChauffeurFormProps) {
  const [nom, setNom] = useState(initial?.nom || "");
  const [telephone, setTelephone] = useState(initial?.telephone || "");
  const [vehicule, setVehicule] = useState(initial?.vehicule || "");
  const [immatriculation, setImmatriculation] = useState(initial?.immatriculation || "");
  const [statut, setStatut] = useState(initial?.statut || "disponible");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ nom, telephone, vehicule, immatriculation, statut });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-line max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-[20px] text-ink">
            {initial?.id ? "Modifier le chauffeur" : "Ajouter un chauffeur"}
          </h3>
          <button type="button" onClick={onCancel} className="text-mute hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-[0.22em] text-mute mb-1 block">Nom complet</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} required
              className="w-full bg-cream border border-line rounded-xl px-4 py-2.5 text-[13px]" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.22em] text-mute mb-1 block">Telephone</label>
            <input value={telephone} onChange={(e) => setTelephone(e.target.value)} required
              className="w-full bg-cream border border-line rounded-xl px-4 py-2.5 text-[13px]" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.22em] text-mute mb-1 block">Véhicule</label>
            <input value={vehicule} onChange={(e) => setVehicule(e.target.value)} required
              className="w-full bg-cream border border-line rounded-xl px-4 py-2.5 text-[13px]" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.22em] text-mute mb-1 block">Immatriculation</label>
            <input value={immatriculation} onChange={(e) => setImmatriculation(e.target.value)} required
              className="w-full bg-cream border border-line rounded-xl px-4 py-2.5 text-[13px]" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.22em] text-mute mb-1 block">Statut</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value)}
              className="w-full bg-cream border border-line rounded-xl px-4 py-2.5 text-[13px]">
              <option value="disponible">Disponible</option>
              <option value="en_course">En course</option>
              <option value="indisponible">Indisponible</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onCancel}
            className="flex-1 border border-line rounded-full py-2.5 text-[13px] text-mute hover:text-ink">
            Annuler
          </button>
          <button type="submit"
            className="flex-1 bg-ink text-cream rounded-full py-2.5 text-[13px] font-medium hover:bg-ink2 btn-press">
            {initial?.id ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  );
}
