"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  MapPin,
  Bed,
  Image as ImageIcon,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Navigation,
  Phone,
  Mail,
  DollarSign,
  Save,
  Loader2,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

interface ResidenceImage {
  id: string;
  url: string;
  legende: string | null;
  ordre: number;
}

interface ResidenceTarif {
  id: string;
  label: string;
  typeChambre: string;
  prixParNuit: number;
  devise: string;
  capacite: number;
  actif: boolean;
}

interface Residence {
  id: string;
  nom: string;
  type: string;
  description: string | null;
  adresse: string;
  ville: string;
  quartier: string | null;
  latitude: number | null;
  longitude: number | null;
  capacite: number;
  equipements: string | null;
  contactNom: string | null;
  contactTel: string | null;
  contactEmail: string | null;
  statut: string;
  images: ResidenceImage[];
  tarifs: ResidenceTarif[];
  _count?: { events: number };
}

interface ResidenceForm {
  nom: string;
  type: string;
  description: string;
  adresse: string;
  ville: string;
  quartier: string;
  mapsLink: string;
  capacite: string;
  equipements: string;
  contactNom: string;
  contactTel: string;
  contactEmail: string;
}

const EMPTY_FORM: ResidenceForm = {
  nom: "",
  type: "hotel",
  description: "",
  adresse: "",
  ville: "",
  quartier: "",
  mapsLink: "",
  capacite: "",
  equipements: "",
  contactNom: "",
  contactTel: "",
  contactEmail: "",
};

const TYPES = [
  { value: "hotel", label: "Hotel" },
  { value: "villa", label: "Villa" },
  { value: "appartement", label: "Appartement" },
  { value: "residence", label: "Residence" },
  { value: "auberge", label: "Auberge" },
];

const EQUIPEMENTS = [
  "WiFi",
  "Climatisation",
  "Piscine",
  "Parking",
  "Restaurant",
  "Bar",
  "Salle de sport",
  "Spa",
  "Room service",
  "Laverie",
  "Coffre-fort",
  "Terrasse",
  "Jardin",
  "Transfert aeroport",
  "Petit-dejeuner inclus",
  "Television",
  "Cuisine equipee",
  "Groupe electrogene",
];

function extractCoordsFromMapsLink(url: string): { lat: number; lng: number } | null {
  if (!url) return null;
  // @lat,lng or @lat,lng,zoom
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  // ?q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  // ll=lat,lng
  const llMatch = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
  return null;
}

function formatPrice(n: number) {
  return n.toLocaleString("fr-FR");
}

export default function ResidencesPage() {
  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ResidenceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tarifForm, setTarifForm] = useState({ label: "", typeChambre: "", prixParNuit: "", capacite: "2" });
  const [savingTarif, setSavingTarif] = useState(false);

  const fetchResidences = useCallback(async () => {
    try {
      const res = await fetch("/api/residences");
      const data = await res.json();
      if (data.success) setResidences(data.data);
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResidences();
  }, [fetchResidences]);

  const update = (patch: Partial<ResidenceForm>) => setForm({ ...form, ...patch });

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (r: Residence) => {
    setEditId(r.id);
    setForm({
      nom: r.nom,
      type: r.type,
      description: r.description ?? "",
      adresse: r.adresse,
      ville: r.ville,
      quartier: r.quartier ?? "",
      mapsLink: r.latitude && r.longitude ? `https://www.google.com/maps?q=${r.latitude},${r.longitude}` : "",
      capacite: r.capacite.toString(),
      equipements: r.equipements ?? "",
      contactNom: r.contactNom ?? "",
      contactTel: r.contactTel ?? "",
      contactEmail: r.contactEmail ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editId ? `/api/residences/${editId}` : "/api/residences";
      const method = editId ? "PUT" : "POST";
      const coords = extractCoordsFromMapsLink(form.mapsLink);
      const payload = {
        ...form,
        latitude: coords?.lat?.toString() ?? "",
        longitude: coords?.lng?.toString() ?? "",
        mapsLink: undefined,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        fetchResidences();
      }
    } catch {
      // silent
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Desactiver cette residence ?")) return;
    await fetch(`/api/residences/${id}`, { method: "DELETE" });
    fetchResidences();
  };

  const handleAddImage = async (residenceId: string, url: string) => {
    await fetch(`/api/residences/${residenceId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    fetchResidences();
  };

  const handleDeleteImage = async (residenceId: string, imageId: string) => {
    await fetch(`/api/residences/${residenceId}/images?imageId=${imageId}`, {
      method: "DELETE",
    });
    fetchResidences();
  };

  const handleAddTarif = async (residenceId: string) => {
    if (!tarifForm.label || !tarifForm.typeChambre || !tarifForm.prixParNuit) return;
    setSavingTarif(true);
    await fetch(`/api/residences/${residenceId}/tarifs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tarifForm),
    });
    setTarifForm({ label: "", typeChambre: "", prixParNuit: "", capacite: "2" });
    setSavingTarif(false);
    fetchResidences();
  };

  const handleDeleteTarif = async (residenceId: string, tarifId: string) => {
    await fetch(`/api/residences/${residenceId}/tarifs?tarifId=${tarifId}`, {
      method: "DELETE",
    });
    fetchResidences();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-serif text-ink">Residences</h1>
          <p className="text-[13px] text-mute mt-1">
            {residences.length} residence{residences.length !== 1 ? "s" : ""} disponible{residences.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-press inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-5 py-2.5 text-[13px] font-semibold"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-cream2 border border-line rounded-2xl p-6 space-y-5 animate-fade-up">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[16px] font-semibold text-ink">
              {editId ? "Modifier la residence" : "Nouvelle residence"}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-mute hover:text-ink">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Nom</label>
              <input
                value={form.nom}
                onChange={(e) => update({ nom: e.target.value })}
                placeholder="ex: Hotel Ivoire"
                className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Type</label>
              <select
                value={form.type}
                onChange={(e) => update({ type: e.target.value })}
                className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={3}
              className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px] resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Adresse</label>
              <input
                value={form.adresse}
                onChange={(e) => update({ adresse: e.target.value })}
                placeholder="Bd de la Republique"
                className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Ville</label>
              <input
                value={form.ville}
                onChange={(e) => update({ ville: e.target.value })}
                placeholder="Abidjan"
                className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Quartier</label>
              <input
                value={form.quartier}
                onChange={(e) => update({ quartier: e.target.value })}
                placeholder="Cocody"
                className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Lien Google Maps</label>
              <input
                value={form.mapsLink}
                onChange={(e) => update({ mapsLink: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
              />
              {form.mapsLink && extractCoordsFromMapsLink(form.mapsLink) && (
                <p className="text-[11px] text-ok mt-1">
                  Coordonnees detectees
                </p>
              )}
              {form.mapsLink && !extractCoordsFromMapsLink(form.mapsLink) && (
                <p className="text-[11px] text-err mt-1">
                  Lien invalide — copiez l&apos;URL depuis Google Maps
                </p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Capacite (chambres)</label>
              <input
                type="number"
                value={form.capacite}
                onChange={(e) => update({ capacite: e.target.value })}
                placeholder="20"
                className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Equipements</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPEMENTS.map((eq) => {
                const selected = form.equipements.split(",").map((s) => s.trim()).filter(Boolean).includes(eq);
                return (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => {
                      const current = form.equipements.split(",").map((s) => s.trim()).filter(Boolean);
                      const next = selected ? current.filter((e) => e !== eq) : [...current, eq];
                      update({ equipements: next.join(", ") });
                    }}
                    className={`text-[12px] rounded-full px-4 py-2 border transition-colors ${
                      selected
                        ? "bg-gold/15 border-gold text-gold font-medium"
                        : "bg-white border-line text-mute hover:border-gold/40"
                    }`}
                  >
                    {eq}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Contact (nom)</label>
              <input
                value={form.contactNom}
                onChange={(e) => update({ contactNom: e.target.value })}
                className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Telephone</label>
              <input
                value={form.contactTel}
                onChange={(e) => update({ contactTel: e.target.value })}
                className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px] mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => update({ contactEmail: e.target.value })}
                className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.nom || !form.adresse || !form.ville}
              className="btn-press inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-6 py-3 text-[13px] font-semibold disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editId ? "Enregistrer" : "Creer"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : residences.length === 0 ? (
        <div className="text-center py-20">
          <Bed className="w-12 h-12 text-mute mx-auto mb-4" />
          <p className="text-mute text-[14px]">Aucune residence enregistree</p>
        </div>
      ) : (
        <div className="space-y-4">
          {residences.map((r) => {
            const isExpanded = expandedId === r.id;
            const firstImage = r.images[0]?.url;
            const equipList = r.equipements?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
            const minPrice = r.tarifs.length > 0 ? Math.min(...r.tarifs.map((t) => t.prixParNuit)) : null;

            return (
              <div key={r.id} className="bg-cream2 border border-line rounded-2xl overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-cream2/80"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  {firstImage ? (
                    <img src={firstImage} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-line flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-6 h-6 text-mute" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-ink truncate">{r.nom}</h3>
                      <span className="text-[10px] uppercase tracking-wider text-mute bg-line rounded-full px-2 py-0.5">
                        {r.type}
                      </span>
                    </div>
                    <p className="text-[12px] text-mute mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {r.quartier ? `${r.quartier}, ` : ""}{r.ville}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-mute">{r.capacite} chambres</span>
                      {minPrice && (
                        <span className="text-[11px] text-gold font-medium">
                          {formatPrice(minPrice)} XOF / nuit
                        </span>
                      )}
                      {r._count && r._count.events > 0 && (
                        <span className="text-[11px] text-mute">{r._count.events} event{r._count.events > 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                      className="p-2 text-mute hover:text-ink rounded-lg hover:bg-white"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                      className="p-2 text-mute hover:text-err rounded-lg hover:bg-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-mute" /> : <ChevronDown className="w-4 h-4 text-mute" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-line p-5 space-y-6 animate-fade-up">
                    {r.description && (
                      <p className="text-[13px] text-ink/80">{r.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-[12px] text-mute">
                      {r.latitude && r.longitude && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-gold hover:underline"
                        >
                          <Navigation className="w-3 h-3" />
                          Itineraire
                        </a>
                      )}
                      {r.contactTel && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {r.contactTel}
                        </span>
                      )}
                      {r.contactEmail && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {r.contactEmail}
                        </span>
                      )}
                    </div>

                    {equipList.length > 0 && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-mute mb-2">Equipements</p>
                        <div className="flex flex-wrap gap-2">
                          {equipList.map((eq) => (
                            <span key={eq} className="text-[11px] bg-white border border-line rounded-full px-3 py-1 text-ink">
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-mute mb-3">
                        Photos ({r.images.length})
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        {r.images.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.url}
                              alt={img.legende ?? ""}
                              className="w-28 h-20 rounded-xl object-cover"
                            />
                            <button
                              onClick={() => handleDeleteImage(r.id, img.id)}
                              className="absolute top-1 right-1 w-5 h-5 bg-ink/70 text-cream rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <div className="w-28">
                          <ImageUpload
                            value=""
                            onChange={(url) => { if (url) handleAddImage(r.id, url); }}
                            folder="residences"
                            aspect="square"
                            placeholder="+ Photo"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-mute mb-3 flex items-center gap-2">
                        <DollarSign className="w-3 h-3" />
                        Tarifs ({r.tarifs.length})
                      </p>

                      {r.tarifs.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {r.tarifs.map((t) => (
                            <div key={t.id} className="flex items-center justify-between bg-white border border-line rounded-xl px-4 py-3">
                              <div>
                                <span className="text-[13px] font-medium text-ink">{t.label}</span>
                                <span className="text-[11px] text-mute ml-2">{t.typeChambre}</span>
                                <span className="text-[11px] text-mute ml-2">{t.capacite} pers.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[14px] font-semibold text-gold">{formatPrice(t.prixParNuit)} {t.devise}</span>
                                <button
                                  onClick={() => handleDeleteTarif(r.id, t.id)}
                                  className="text-mute hover:text-err"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <input
                            value={tarifForm.label}
                            onChange={(e) => setTarifForm({ ...tarifForm, label: e.target.value })}
                            placeholder="Nom (ex: Standard)"
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12px]"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            value={tarifForm.typeChambre}
                            onChange={(e) => setTarifForm({ ...tarifForm, typeChambre: e.target.value })}
                            placeholder="Type (ex: Double)"
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12px]"
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            value={tarifForm.prixParNuit}
                            onChange={(e) => setTarifForm({ ...tarifForm, prixParNuit: e.target.value })}
                            placeholder="Prix/nuit"
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12px] mono"
                          />
                        </div>
                        <div className="w-16">
                          <input
                            type="number"
                            value={tarifForm.capacite}
                            onChange={(e) => setTarifForm({ ...tarifForm, capacite: e.target.value })}
                            placeholder="Cap."
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12px]"
                          />
                        </div>
                        <button
                          onClick={() => handleAddTarif(r.id)}
                          disabled={savingTarif}
                          className="btn-press bg-ink text-cream rounded-lg px-3 py-2 text-[12px]"
                        >
                          {savingTarif ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
