"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/admin/topbar";
import { fmt } from "@/lib/utils";

interface EventStats {
  totalEvents: number;
  totalParticipants: number;
  totalRevenue: number;
  totalCheckins: number;
  events: {
    slug: string;
    nom: string;
    participants: number;
    revenue: number;
    checkins: number;
    dateDebut: string;
  }[];
}

export default function RapportsPage() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<any>(null);
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [tab, setTab] = useState<"concierge" | "events">("events");

  useEffect(() => {
    fetch(`/api/admin/stats/reports?days=${period}`)
      .then((r) => r.json())
      .then(setData);
    fetch("/api/admin/stats/events")
      .then((r) => r.json())
      .then((d) => { if (d.success) setEventStats(d.data); });
  }, [period]);

  const periods = [
    { days: 1, label: "Aujourd'hui" },
    { days: 7, label: "7 jours" },
    { days: 30, label: "30 jours" },
  ];

  return (
    <>
      <Topbar title="Rapports" subtitle="Statistiques d'activite">
        <div className="flex items-center gap-3">
          <div className="inline-flex bg-cream border border-line rounded-full p-1 text-[12px]">
            <button
              onClick={() => setTab("events")}
              className={`px-3 py-1 rounded-full ${tab === "events" ? "bg-gold text-ink font-medium" : "text-mute"}`}
            >
              Events
            </button>
            <button
              onClick={() => setTab("concierge")}
              className={`px-3 py-1 rounded-full ${tab === "concierge" ? "bg-ink text-cream font-medium" : "text-mute"}`}
            >
              Concierge
            </button>
          </div>
          {tab === "concierge" && (
            <div className="inline-flex bg-cream border border-line rounded-full p-1 text-[12px]">
              {periods.map((p) => (
                <button
                  key={p.days}
                  onClick={() => setPeriod(p.days)}
                  className={`px-3 py-1 rounded-full ${period === p.days ? "bg-ink text-cream font-medium" : "text-mute"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </Topbar>
      <div className="p-6 lg:p-10">
        {tab === "events" && eventStats && (
          <div className="space-y-8 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-line p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-mute">Evenements</p>
                <p className="figure text-[32px] text-ink mt-2">{eventStats.totalEvents}</p>
              </div>
              <div className="bg-white rounded-2xl border border-line p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-mute">Participants</p>
                <p className="figure text-[32px] text-ink mt-2">{eventStats.totalParticipants}</p>
              </div>
              <div className="bg-white rounded-2xl border border-line p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-mute">Revenus Events</p>
                <p className="figure text-[32px] text-gold mt-2">{fmt(eventStats.totalRevenue)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-line p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-mute">Check-ins</p>
                <p className="figure text-[32px] text-ink mt-2">{eventStats.totalCheckins}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-line p-5">
              <h3 className="font-serif text-[18px] text-ink mb-4">Evenements actifs</h3>
              <table className="w-full text-[13px]">
                <thead className="text-[10px] uppercase tracking-[0.18em] text-mute">
                  <tr>
                    <th className="text-left font-medium py-2">Evenement</th>
                    <th className="text-right font-medium py-2">Participants</th>
                    <th className="text-right font-medium py-2">Check-ins</th>
                    <th className="text-right font-medium py-2">Revenus</th>
                    <th className="text-right font-medium py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {eventStats.events.map((ev) => (
                    <tr key={ev.slug}>
                      <td className="py-3 text-ink font-medium">{ev.nom}</td>
                      <td className="py-3 text-right mono text-mute">{ev.participants}</td>
                      <td className="py-3 text-right mono text-mute">{ev.checkins}</td>
                      <td className="py-3 text-right mono text-gold font-semibold">{fmt(ev.revenue)}</td>
                      <td className="py-3 text-right text-mute text-[12px]">
                        {new Date(ev.dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "concierge" && (
          <>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-line p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-mute">CA total</p>
            <p className="figure text-[32px] text-ink mt-2">{data ? fmt(data.totalCA) : "—"}</p>
          </div>
          <div className="bg-white rounded-2xl border border-line p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-mute">Commandes</p>
            <p className="figure text-[32px] text-ink mt-2">{data?.orderCount ?? "—"}</p>
          </div>
          <div className="bg-white rounded-2xl border border-line p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-mute">Panier moyen</p>
            <p className="figure text-[32px] text-ink mt-2">{data ? fmt(data.avgBasket) : "—"}</p>
          </div>
          <div className="bg-white rounded-2xl border border-line p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-mute">Taux confirmation</p>
            <p className="figure text-[32px] text-ink mt-2">{data?.confRate ?? "—"}%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-line p-5 mb-8">
          <h3 className="font-serif text-[18px] text-ink mb-4">Top 5 services</h3>
          <table className="w-full text-[13px]">
            <thead className="text-[10px] uppercase tracking-[0.18em] text-mute">
              <tr>
                <th className="text-left font-medium py-2">Service</th>
                <th className="text-right font-medium py-2">Quantité</th>
                <th className="text-right font-medium py-2">CA généré</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data?.topServices?.map((s: any, i: number) => (
                <tr key={i}>
                  <td className="py-3 text-ink font-medium">{s.nom}</td>
                  <td className="py-3 text-right mono text-mute">{s.qty}</td>
                  <td className="py-3 text-right mono text-ink font-semibold">{fmt(s.ca)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl border border-line p-5">
          <h3 className="font-serif text-[18px] text-ink mb-4">CA par jour</h3>
          {data?.caByDay && (
            <div className="space-y-2">
              {Object.entries(data.caByDay as Record<string, number>)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([day, amount]) => {
                  const maxCA = Math.max(...Object.values(data.caByDay as Record<string, number>));
                  const pct = maxCA > 0 ? ((amount as number) / maxCA) * 100 : 0;
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-[12px] mono text-mute w-24">{day}</span>
                      <div className="flex-1 h-5 bg-cream rounded-full overflow-hidden">
                        <div className="h-full bg-ink rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[12px] mono text-ink w-32 text-right">{fmt(amount as number)}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </>
  );
}
