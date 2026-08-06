"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/admin/topbar";
import { KpiCard } from "@/components/admin/kpi-card";
import {
  Landmark,
  Users,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface ParticipantData {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  organisation: string | null;
  ticketNumber: number;
  checkedIn: boolean;
  createdAt: string;
}

interface EventData {
  id: string;
  slug: string;
  nom: string;
  type: string;
  lieu: string;
  ville: string;
  dateDebut: string;
  dateFin: string;
  capacite: number;
  statut: string;
  _count: { participants: number };
  participants: ParticipantData[];
}

interface Stats {
  totalEvents: number;
  actifs: number;
  totalParticipants: number;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function EventBlock({ evt }: { evt: EventData }) {
  const [open, setOpen] = useState(false);
  const checkedCount = evt.participants.filter((p) => p.checkedIn).length;

  return (
    <div className="bg-white rounded-2xl border border-line shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-cream/40 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-serif text-[17px] text-ink truncate">{evt.nom}</h3>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
              evt.statut === "actif" ? "bg-ok/10 text-ok" : "bg-mute/10 text-mute"
            }`}>
              {evt.statut}
            </span>
          </div>
          <p className="text-[12px] text-mute">
            {formatDate(evt.dateDebut)} — {formatDate(evt.dateFin)} · {evt.lieu}, {evt.ville}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-[14px] font-semibold text-ink">{evt._count.participants}</p>
            <p className="text-[10px] text-mute uppercase">inscrits</p>
          </div>
          <div className="text-right">
            <p className="text-[14px] font-semibold text-ok">{checkedCount}</p>
            <p className="text-[10px] text-mute uppercase">check-in</p>
          </div>
          {open ? <ChevronUp size={18} className="text-mute" /> : <ChevronDown size={18} className="text-mute" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-line">
          <div className="px-5 py-3 flex items-center justify-between bg-cream/30">
            <span className="text-[11px] text-mute uppercase tracking-wider">
              {evt.participants.length} participant{evt.participants.length > 1 ? "s" : ""}
            </span>
            <Link
              href={`/fr/evenements/${evt.slug}`}
              target="_blank"
              className="text-[11px] text-gold flex items-center gap-1 hover:underline"
            >
              Page publique <ExternalLink size={12} />
            </Link>
          </div>
          {evt.participants.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Users size={32} className="mx-auto text-mute/20 mb-2" />
              <p className="text-[13px] text-mute">Aucun participant inscrit</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="text-[10px] uppercase tracking-[0.18em] text-mute bg-cream/50">
                  <tr>
                    <th className="text-left font-medium px-5 py-2.5">N°</th>
                    <th className="text-left font-medium px-5 py-2.5">Nom</th>
                    <th className="text-left font-medium px-5 py-2.5">Organisation</th>
                    <th className="text-left font-medium px-5 py-2.5">Contact</th>
                    <th className="text-center font-medium px-5 py-2.5">Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {evt.participants.map((p) => (
                    <tr key={p.id} className="hover:bg-cream/30">
                      <td className="px-5 py-3 mono text-[12px] text-mute">
                        {String(p.ticketNumber).padStart(4, "0")}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-ink font-medium">{p.prenom} {p.nom}</p>
                      </td>
                      <td className="px-5 py-3 text-mute">{p.organisation || "—"}</td>
                      <td className="px-5 py-3">
                        <p className="text-[12px] text-mute">{p.email}</p>
                        <p className="text-[11px] text-mute/60">{p.telephone}</p>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {p.checkedIn ? (
                          <CheckCircle2 size={16} className="mx-auto text-ok" />
                        ) : (
                          <span className="text-[10px] text-mute">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DashboardInstitutionnel() {
  const [data, setData] = useState<{ events: EventData[]; stats: Stats } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats/institutionnel")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar title="Événements institutionnels" subtitle="Délégations VIP · Suivi" />
      <div className="p-6 lg:p-10">
        {loading ? (
          <div className="text-center text-mute py-20">Chargement…</div>
        ) : !data || data.events.length === 0 ? (
          <div className="text-center py-20">
            <Landmark size={48} className="mx-auto text-mute/30 mb-4" />
            <p className="text-mute">Aucun événement institutionnel</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <KpiCard
                label="Événements"
                value={String(data.stats.totalEvents)}
                sub={`${data.stats.actifs} actif${data.stats.actifs > 1 ? "s" : ""}`}
              />
              <KpiCard
                label="Participants"
                value={String(data.stats.totalParticipants)}
                sub="Total inscrits"
              />
              <KpiCard
                label="Check-ins"
                value={String(data.events.reduce((s, e) => s + e.participants.filter((p) => p.checkedIn).length, 0))}
                sub="Validés"
                trend={{ value: "VIP", type: "success" }}
              />
            </div>

            <div className="space-y-4">
              {data.events.map((evt) => (
                <EventBlock key={evt.id} evt={evt} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
