"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Topbar } from "@/components/admin/topbar";
import { fmt } from "@/lib/utils";
import Link from "next/link";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Calendar,
  Users,
  Eye,
  Trash2,
  ExternalLink,
  Loader2,
  QrCode,
  Edit3,
  X,
  Save,
} from "lucide-react";

interface EventItem {
  id: string;
  slug: string;
  nom: string;
  type: string;
  description: string | null;
  organisateur: string;
  lieu: string;
  ville: string;
  dateDebut: string;
  dateFin: string;
  capacite: number;
  contactEmail: string;
  contactTel: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  prixBadge: number;
  prixTicket: number;
  statut: string;
  createdAt: string;
  _count: { participants: number };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function toInputDate(d: string) {
  return new Date(d).toISOString().split("T")[0];
}

export default function AdminEventsPage() {
  const { data: session } = useSession();
  const isReadOnly = session?.user?.role === "AGENT_INSTITUTIONNEL" || session?.user?.role === "SUPERVISEUR";
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    nom: "", type: "", description: "", organisateur: "",
    lieu: "", ville: "", dateDebut: "", dateFin: "",
    capacite: "", contactEmail: "", contactTel: "",
    logoUrl: "", coverUrl: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEvents(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleStatut = async (id: string, current: string) => {
    const newStatut = current === "actif" ? "inactif" : "actif";
    await fetch(`/api/admin/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: newStatut }),
    });
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, statut: newStatut } : e))
    );
  };

  const openEdit = (evt: EventItem) => {
    setEditId(evt.id);
    setEditForm({
      nom: evt.nom,
      type: evt.type,
      description: evt.description ?? "",
      organisateur: evt.organisateur,
      lieu: evt.lieu,
      ville: evt.ville,
      dateDebut: toInputDate(evt.dateDebut),
      dateFin: toInputDate(evt.dateFin),
      capacite: String(evt.capacite),
      contactEmail: evt.contactEmail,
      contactTel: evt.contactTel ?? "",
      logoUrl: evt.logoUrl ?? "",
      coverUrl: evt.coverUrl ?? "",
    });
  };

  const handleSave = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) =>
          prev.map((e) => (e.id === editId ? { ...e, ...data.data } : e))
        );
        setEditId(null);
      }
    } catch {}
    setSaving(false);
  };

  const actifs = events.filter((e) => e.statut === "actif");
  const inactifs = events.filter((e) => e.statut !== "actif");

  return (
    <>
      <Topbar title="Événements" subtitle={`${actifs.length} actif${actifs.length > 1 ? "s" : ""} · ${events.length} total`} />
      <div className="p-6 lg:p-10">
        {/* Edit form */}
        {editId && (
          <div className="bg-cream2 border border-line rounded-2xl p-6 mb-6 space-y-5 animate-fade-up">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-ink">Modifier l&apos;événement</h2>
              <button onClick={() => setEditId(null)} className="text-mute hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Nom</label>
                <input
                  value={editForm.nom}
                  onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                  className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Organisateur</label>
                <input
                  value={editForm.organisateur}
                  onChange={(e) => setEditForm({ ...editForm, organisateur: e.target.value })}
                  className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px] resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Lieu</label>
                <input
                  value={editForm.lieu}
                  onChange={(e) => setEditForm({ ...editForm, lieu: e.target.value })}
                  className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Ville</label>
                <input
                  value={editForm.ville}
                  onChange={(e) => setEditForm({ ...editForm, ville: e.target.value })}
                  className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Capacite</label>
                <input
                  type="number"
                  value={editForm.capacite}
                  onChange={(e) => setEditForm({ ...editForm, capacite: e.target.value })}
                  className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Date debut</label>
                <input
                  type="date"
                  value={editForm.dateDebut}
                  onChange={(e) => setEditForm({ ...editForm, dateDebut: e.target.value })}
                  className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Date fin</label>
                <input
                  type="date"
                  value={editForm.dateFin}
                  onChange={(e) => setEditForm({ ...editForm, dateFin: e.target.value })}
                  className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Email contact</label>
                <input
                  type="email"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                  className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink mb-1.5 uppercase tracking-wider">Telephone</label>
                <input
                  value={editForm.contactTel}
                  onChange={(e) => setEditForm({ ...editForm, contactTel: e.target.value })}
                  className="w-full bg-white border border-line rounded-xl px-4 py-3 text-[14px]"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <ImageUpload
                value={editForm.logoUrl}
                onChange={(url) => setEditForm({ ...editForm, logoUrl: url })}
                folder="logos"
                aspect="square"
                label="Logo"
                placeholder="Logo (carre)"
              />
              <ImageUpload
                value={editForm.coverUrl}
                onChange={(url) => setEditForm({ ...editForm, coverUrl: url })}
                folder="covers"
                aspect="cover"
                label="Image de couverture"
                placeholder="Cover (panoramique)"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !editForm.nom}
                className="btn-press inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-6 py-3 text-[13px] font-semibold disabled:opacity-40"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-mute mx-auto mb-4" />
            <p className="text-mute">Aucun événement cree</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...actifs, ...inactifs].map((evt) => (
              <div
                key={evt.id}
                className={`bg-white rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
                  evt.statut === "actif" ? "border-line" : "border-line opacity-50"
                }`}
              >
                {evt.coverUrl && (
                  <img src={evt.coverUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif text-[18px] text-ink truncate">{evt.nom}</h3>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      evt.statut === "actif" ? "bg-ok/10 text-ok" : "bg-mute/10 text-mute"
                    }`}>
                      {evt.statut}
                    </span>
                  </div>
                  <p className="text-[13px] text-mute">
                    {formatDate(evt.dateDebut)} — {formatDate(evt.dateFin)} · {evt.lieu}, {evt.ville}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-[12px] text-mute">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {evt._count.participants}/{evt.capacite}
                    </span>
                    <span className="mono">
                      {evt.prixBadge === 0 && evt.prixTicket === 0
                        ? "Gratuit"
                        : fmt(evt.prixTicket || evt.prixBadge)}
                    </span>
                    <span className="capitalize">{evt.type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/fr/evenements/${evt.slug}`}
                    target="_blank"
                    className="w-9 h-9 rounded-xl bg-cream2 border border-line flex items-center justify-center text-mute hover:text-ink transition-colors"
                    title="Page publique"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  {!isReadOnly && (
                    <>
                      <button
                        onClick={() => openEdit(evt)}
                        className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold hover:bg-gold/20 transition-colors"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/fr/organisateur/${evt.slug}`}
                        target="_blank"
                        className="w-9 h-9 rounded-xl bg-cream2 border border-line flex items-center justify-center text-mute hover:text-ink transition-colors"
                        title="Dashboard organisateur"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/fr/scan/${evt.slug}`}
                        target="_blank"
                        className="w-9 h-9 rounded-xl bg-cream2 border border-line flex items-center justify-center text-mute hover:text-ink transition-colors"
                        title="Scanner QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => toggleStatut(evt.id, evt.statut)}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                          evt.statut === "actif"
                            ? "bg-err/5 border-err/20 text-err hover:bg-err/10"
                            : "bg-ok/5 border-ok/20 text-ok hover:bg-ok/10"
                        }`}
                        title={evt.statut === "actif" ? "Desactiver" : "Reactiver"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
