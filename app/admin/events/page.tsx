"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Topbar } from "@/components/admin/topbar";
import { fmt } from "@/lib/utils";
import Link from "next/link";
import {
  Calendar,
  Users,
  Eye,
  Trash2,
  ExternalLink,
  Loader2,
  QrCode,
} from "lucide-react";

interface EventItem {
  id: string;
  slug: string;
  nom: string;
  type: string;
  lieu: string;
  ville: string;
  dateDebut: string;
  dateFin: string;
  capacite: number;
  prixBadge: number;
  prixTicket: number;
  statut: string;
  createdAt: string;
  _count: { participants: number };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminEventsPage() {
  const { data: session } = useSession();
  const isReadOnly = session?.user?.role === "AGENT_INSTITUTIONNEL" || session?.user?.role === "SUPERVISEUR";
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const actifs = events.filter((e) => e.statut === "actif");
  const inactifs = events.filter((e) => e.statut !== "actif");

  return (
    <>
      <Topbar title="Événements" subtitle={`${actifs.length} actif${actifs.length > 1 ? "s" : ""} · ${events.length} total`} />
      <div className="p-6 lg:p-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-mute mx-auto mb-4" />
            <p className="text-mute">Aucun evenement cree</p>
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
                    href={`/fr/evenement/${evt.slug}`}
                    target="_blank"
                    className="w-9 h-9 rounded-xl bg-cream2 border border-line flex items-center justify-center text-mute hover:text-ink transition-colors"
                    title="Page publique"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  {!isReadOnly && (
                    <>
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
