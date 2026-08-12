"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/admin/topbar";
import { BriefingCard } from "@/components/admin/briefing-card";
import { DayTimeline } from "@/components/admin/day-timeline";
import { ClipboardCheck } from "lucide-react";

interface ClientData {
  commandeId: string;
  reference: string;
  prenom: string;
  nom: string;
  dateArrivee: string;
  dateDepart: string;
  nombrePersonnes: number;
  statut: string;
}

interface PlanningEntry {
  heure: string;
  clientName: string;
  titre: string;
  type: string;
}

interface NoteData {
  id: string;
  auteurNom: string;
  clientName: string;
  contenu: string;
  createdAt: string;
}

interface ConciergeData {
  clients: ClientData[];
  todayPlanning: PlanningEntry[];
  recentNotes: NoteData[];
}

export function DashboardConcierge() {
  const [data, setData] = useState<ConciergeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats/concierge")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayClients = data?.clients.filter((c) => {
    const arr = new Date(c.dateArrivee);
    const dep = new Date(c.dateDepart);
    arr.setHours(0, 0, 0, 0);
    dep.setHours(23, 59, 59, 999);
    return arr <= today && dep >= today;
  }) || [];

  const upcomingClients = data?.clients.filter((c) => {
    const arr = new Date(c.dateArrivee);
    arr.setHours(0, 0, 0, 0);
    return arr > today;
  }) || [];

  function timeAgo(dateStr: string): string {
    // Meme cas que TeamLoadCard : libelle relatif dans un ecran back-office
    // rendu uniquement cote client.
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  }

  return (
    <>
      <Topbar title="Tableau de bord" subtitle="Votre briefing du jour" />
      <div className="p-6 lg:p-10">
        {loading ? (
          <div className="text-center text-mute py-20">Chargement…</div>
        ) : data && data.clients.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardCheck size={48} className="mx-auto text-mute/30 mb-4" />
            <p className="text-mute">Aucun client assigné pour le moment</p>
          </div>
        ) : (
          <div className="space-y-8">
            {todayClients.length > 0 && (
              <div>
                <h3 className="text-[12px] uppercase tracking-wider text-mute mb-4">Aujourd&apos;hui</h3>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {todayClients.map((c) => (
                    <BriefingCard
                      key={c.commandeId}
                      commandeId={c.commandeId}
                      reference={c.reference}
                      clientName={`${c.prenom} ${c.nom}`}
                      dateArrivee={c.dateArrivee}
                      dateDepart={c.dateDepart}
                      nombrePersonnes={c.nombrePersonnes}
                      statut={c.statut}
                    />
                  ))}
                </div>
              </div>
            )}

            {upcomingClients.length > 0 && (
              <div>
                <h3 className="text-[12px] uppercase tracking-wider text-mute mb-4">À venir</h3>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {upcomingClients.map((c) => (
                    <BriefingCard
                      key={c.commandeId}
                      commandeId={c.commandeId}
                      reference={c.reference}
                      clientName={`${c.prenom} ${c.nom}`}
                      dateArrivee={c.dateArrivee}
                      dateDepart={c.dateDepart}
                      nombrePersonnes={c.nombrePersonnes}
                      statut={c.statut}
                    />
                  ))}
                </div>
              </div>
            )}

            {data && <DayTimeline entries={data.todayPlanning} />}

            {data && data.recentNotes.length > 0 && (
              <div className="bg-white rounded-2xl border border-line shadow-card">
                <div className="px-5 py-4">
                  <h3 className="font-serif text-[18px] text-ink">Notes récentes</h3>
                </div>
                <div className="divide-y divide-line">
                  {data.recentNotes.map((n) => (
                    <div key={n.id} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] text-ink font-medium">{n.clientName}</span>
                        <span className="text-[11px] text-mute">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-[13px] text-mute truncate">
                        {n.auteurNom} — {n.contenu.length > 100 ? n.contenu.slice(0, 100) + "…" : n.contenu}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
