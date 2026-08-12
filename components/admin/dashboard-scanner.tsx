"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/admin/topbar";
import Link from "next/link";
import {
  ScanLine,
  CalendarDays,
  Users,
  CheckCircle2,
  Loader2,
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
  statut: string;
  _count: { participants: number };
  checkedInCount: number;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function DashboardScanner() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/events/scannable")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEvents(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const actifs = events.filter((e) => e.statut === "actif");

  return (
    <>
      <Topbar
        title="Scanner"
        subtitle={`${actifs.length} événement${actifs.length > 1 ? "s" : ""} actif${actifs.length > 1 ? "s" : ""}`}
      />
      <div className="p-6 lg:p-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <ScanLine className="w-12 h-12 text-mute mx-auto mb-4" />
            <p className="text-mute">Aucun événement a scanner</p>
          </div>
        ) : (
          <div className="space-y-4">
            {actifs.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-2xl border border-line shadow-card p-5 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-5 h-5 text-gold" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-[17px] text-ink truncate">
                    {evt.nom}
                  </h3>
                  <p className="text-[12px] text-mute mt-0.5">
                    {formatDate(evt.dateDebut)} — {formatDate(evt.dateFin)} · {evt.lieu}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-mute">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {evt._count.participants}/{evt.capacite}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-ok" />
                      {evt.checkedInCount} check-in{evt.checkedInCount > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/fr/scan/${evt.slug}`}
                  className="bg-ink hover:bg-ink/90 text-cream rounded-xl px-5 py-3 text-[14px] font-semibold flex items-center gap-2 flex-shrink-0 transition-colors"
                >
                  <ScanLine className="w-4 h-4" />
                  Scanner
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
