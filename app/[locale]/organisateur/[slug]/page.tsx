"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Users,
  Ticket,
  Calendar,
  MapPin,
  Copy,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Search,
  ScanLine,
  BarChart3,
  Lock,
} from "lucide-react";
import { loadManageToken, storeManageToken } from "@/lib/manage-token";

interface Participant {
  id: string;
  reference: string;
  ticketNumber: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  organisation: string | null;
  type: string;
  statut: string;
  montant: number;
  checkedIn: boolean;
  createdAt: string;
  serviceIds?: string[];
}

interface EventData {
  id: string;
  slug: string;
  nom: string;
  type: string;
  description: string;
  organisateur: string;
  lieu: string;
  ville: string;
  dateDebut: string;
  dateFin: string;
  capacite: number;
  badgePayant: boolean;
  prixBadge: number;
  ticketPayant: boolean;
  prixTicket: number;
  statut: string;
  checkedInCount: number;
  services?: { id: string; nom: string }[];
  _count: { participants: number };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function OrganisateurDashboardContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Le lien prive (?token=...) prime, sinon on reprend celui memorise
    // par le navigateur qui a cree l'evenement.
    const urlToken = searchParams.get("token") ?? "";
    if (urlToken) storeManageToken(slug, urlToken);
    const token = urlToken || loadManageToken(slug);
    // Meme raison : le stockage local nest lisible quapres le montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(token);

    const loadEvent = async () => {
      try {
        const d = await fetch(`/api/events/${slug}`).then((r) => r.json());
        if (d.success) setEvent(d.data);
      } catch {
        // l'ecran "evenement introuvable" prend le relais
      }
    };

    const loadParticipants = async () => {
      if (!token) {
        setAccessDenied(true);
        return;
      }
      try {
        const res = await fetch(
          `/api/events/${slug}/participants?token=${encodeURIComponent(token)}`,
        );
        if (!res.ok) {
          setAccessDenied(true);
          return;
        }
        const d = await res.json();
        if (d.success) setParticipants(d.data);
      } catch {
        setAccessDenied(true);
      }
    };

    Promise.all([loadEvent(), loadParticipants()]).finally(() => setLoading(false));
  }, [slug, searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-24 text-center">
        <p className="text-mute text-[16px]">Événement introuvable</p>
        <Link href={`/${locale}`} className="text-gold mt-4 inline-block">Retour</Link>
      </div>
    );
  }

  const isConcert = event.type === "concert";
  const totalRevenue = participants.reduce((sum, p) => sum + p.montant, 0);
  const checkedInCount = accessDenied
    ? event.checkedInCount
    : participants.filter((p) => p.checkedIn).length;
  const eventUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/evenements/${event.slug}`;

  const serviceName = (id: string) =>
    event.services?.find((s) => s.id === id)?.nom ?? id;

  const filtered = participants.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.prenom.toLowerCase().includes(q) ||
      p.nom.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.reference.toLowerCase().includes(q)
    );
  });

  return (
    <section className="animate-fade-up">
      <div className="max-w-6xl mx-auto px-5 lg:px-8 pt-10 pb-24">
        <Link href={`/${locale}`} className="text-[13px] text-mute hover:text-ink flex items-center gap-1.5 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        {/* Header */}
        <div className="bg-ink text-cream rounded-2xl p-8 sm:p-10 mb-8">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-cream/40 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span>Dashboard organisateur</span>
          </div>
          <h1 className="font-serif text-[32px] sm:text-[40px] text-cream leading-tight">
            {event.nom}
          </h1>
          <p className="text-cream/50 text-[14px] mt-2">{event.organisateur}</p>

          <div className="grid sm:grid-cols-4 gap-6 mt-8">
            <div>
              <p className="text-[11px] text-cream/40 uppercase tracking-wider">Participants</p>
              <p className="font-serif text-[32px] text-gold">{event._count.participants}</p>
            </div>
            <div>
              <p className="text-[11px] text-cream/40 uppercase tracking-wider">Check-ins</p>
              <p className="font-serif text-[32px] text-cream">
                {checkedInCount}
                <span className="text-[14px] text-cream/30 ml-1">/ {event._count.participants}</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-cream/40 uppercase tracking-wider">Revenus</p>
              <p className="font-serif text-[32px] text-gold">{new Intl.NumberFormat("fr-FR").format(totalRevenue)} <span className="text-[14px] text-cream/40">XOF</span></p>
            </div>
            <div>
              <p className="text-[11px] text-cream/40 uppercase tracking-wider">Capacite</p>
              <p className="font-serif text-[32px] text-cream">{event._count.participants}/{event.capacite}</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-cream/10 flex flex-wrap gap-3">
            <Link
              href={
                token
                  ? `/${locale}/scan/${event.slug}?token=${encodeURIComponent(token)}`
                  : `/${locale}/scan/${event.slug}`
              }
              className="btn-press inline-flex items-center gap-2.5 bg-gold hover:bg-gold2 text-ink rounded-full px-6 py-3.5 text-[14px] font-semibold"
            >
              <ScanLine className="w-5 h-5" />
              Scanner &amp; imprimer les badges
            </Link>
          </div>
        </div>

        {/* Event info + QR */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-white border border-line rounded-2xl p-6">
            <p className="text-[12px] uppercase tracking-wider text-mute mb-4">Informations</p>
            <div className="grid sm:grid-cols-2 gap-4 text-[14px]">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gold" />
                <span>{formatDate(event.dateDebut)} — {formatDate(event.dateFin)}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gold" />
                <span>{event.lieu} · {event.ville}</span>
              </div>
              <div className="flex items-center gap-3">
                <Ticket className="w-4 h-4 text-gold" />
                <span>{isConcert ? "Concert" : "Conference"} · {event.badgePayant || event.ticketPayant ? "Payant" : "Gratuit"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-gold" />
                <span>Capacite : {event.capacite} places</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-line">
              <p className="text-[12px] uppercase tracking-wider text-mute mb-2">Lien inscription</p>
              <div className="flex items-center gap-2">
                <input readOnly value={eventUrl} className="flex-1 bg-cream2 border border-line rounded-xl px-4 py-2.5 text-[13px] mono" />
                <button onClick={() => navigator.clipboard?.writeText(eventUrl)} className="btn-press bg-ink text-cream rounded-xl px-3 py-2.5">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-line rounded-2xl p-6 flex flex-col items-center justify-center">
            <QRCodeSVG value={eventUrl} size={140} bgColor="transparent" fgColor="#0A0A0A" level="M" />
            <p className="text-[11px] text-mute mt-3 text-center">QR Code inscription</p>
          </div>
        </div>

        {/* Revenue analytics */}
        {totalRevenue > 0 && (
          <div className="bg-white border border-line rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-gold" />
              <h2 className="font-serif text-[20px] text-ink">Analyse des revenus</h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-cream2 rounded-xl p-4">
                <p className="text-[11px] text-mute uppercase tracking-wider">Revenu total</p>
                <p className="font-serif text-[24px] text-ink mt-1">
                  {new Intl.NumberFormat("fr-FR").format(totalRevenue)} <span className="text-[12px] text-mute">XOF</span>
                </p>
              </div>
              <div className="bg-cream2 rounded-xl p-4">
                <p className="text-[11px] text-mute uppercase tracking-wider">Panier moyen</p>
                <p className="font-serif text-[24px] text-ink mt-1">
                  {new Intl.NumberFormat("fr-FR").format(
                    Math.round(totalRevenue / (participants.filter((p) => p.montant > 0).length || 1))
                  )} <span className="text-[12px] text-mute">XOF</span>
                </p>
              </div>
              <div className="bg-cream2 rounded-xl p-4">
                <p className="text-[11px] text-mute uppercase tracking-wider">Taux de conversion</p>
                <p className="font-serif text-[24px] text-ink mt-1">
                  {event._count.participants > 0
                    ? Math.round((participants.filter((p) => p.montant > 0).length / event._count.participants) * 100)
                    : 0}
                  <span className="text-[12px] text-mute"> %</span>
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-mute uppercase tracking-wider mb-3">Repartition par jour</p>
              <div className="space-y-2">
                {(() => {
                  const byDay: Record<string, { count: number; revenue: number }> = {};
                  participants.forEach((p) => {
                    const day = new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
                    if (!byDay[day]) byDay[day] = { count: 0, revenue: 0 };
                    byDay[day].count++;
                    byDay[day].revenue += p.montant;
                  });
                  const maxRev = Math.max(...Object.values(byDay).map((d) => d.revenue), 1);
                  return Object.entries(byDay).map(([day, data]) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-[12px] text-mute w-16 text-right">{day}</span>
                      <div className="flex-1 bg-cream2 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-gold/30 h-full rounded-full flex items-center px-2"
                          style={{ width: `${Math.max((data.revenue / maxRev) * 100, 8)}%` }}
                        >
                          <span className="text-[10px] text-ink font-medium whitespace-nowrap">
                            {data.count} inscr. · {new Intl.NumberFormat("fr-FR").format(data.revenue)} XOF
                          </span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Accès privé requis */}
        {accessDenied && (
          <div className="bg-white border border-line rounded-2xl px-6 py-12 text-center">
            <Lock className="w-10 h-10 text-gold mx-auto mb-4" />
            <h2 className="font-serif text-[22px] text-ink mb-2">Liste des inscrits protégée</h2>
            <p className="text-[14px] text-mute max-w-md mx-auto leading-relaxed">
              Les coordonnees de vos participants ne sont accessibles qu&apos;avec votre lien
              privé de gestion. Il vous a ete envoyé par email à la création de
              l&apos;événement — ouvrez cette page depuis ce lien.
            </p>
          </div>
        )}

        {/* Participant list */}
        {!accessDenied && (
        <div className="bg-white border border-line rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-[22px] text-ink">Participants</h2>
              <p className="text-[13px] text-mute">{event._count.participants} inscrits</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="bg-cream2 border border-line rounded-xl pl-9 pr-4 py-2.5 text-[13px] w-[220px]"
                />
              </div>
              <button
                onClick={() => {
                  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
                  const sep = ";";
                  const header = ["N°", "Reference", "Prenom", "Nom", "Email", "Telephone", "Organisation", "Type", "Montant (XOF)", "Services demandes", "Check-in", "Date inscription"].join(sep);
                  const rows = participants.map((p) =>
                    [
                      String(p.ticketNumber).padStart(4, "0"),
                      p.reference,
                      esc(p.prenom),
                      esc(p.nom),
                      p.email,
                      p.telephone,
                      esc(p.organisation ?? ""),
                      p.type,
                      String(p.montant),
                      esc((p.serviceIds ?? []).map((id) => serviceName(id)).join(" + ")),
                      p.checkedIn ? "Oui" : "Non",
                      new Date(p.createdAt).toLocaleDateString("fr-FR"),
                    ].join(sep)
                  );
                  const bom = "﻿";
                  const csv = bom + [header, ...rows].join("\r\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${event.slug}-participants.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="btn-press inline-flex items-center gap-2 bg-ink text-cream rounded-xl px-4 py-2.5 text-[13px] font-medium"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users className="w-10 h-10 text-line mx-auto mb-3" />
              <p className="text-mute text-[14px]">
                {search ? "Aucun résultat" : "Aucun participant pour le moment"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-mute bg-cream2">
                    <th className="text-left px-6 py-3 font-medium">N°</th>
                    <th className="text-left px-4 py-3 font-medium">Ref</th>
                    <th className="text-left px-4 py-3 font-medium">Nom</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-right px-4 py-3 font-medium">Montant</th>
                    <th className="text-center px-4 py-3 font-medium">Check-in</th>
                    <th className="text-left px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-t border-line hover:bg-cream2/50">
                      <td className="px-6 py-3 font-mono font-semibold">{String(p.ticketNumber).padStart(4, "0")}</td>
                      <td className="px-4 py-3 font-mono text-gold text-[12px]">{p.reference}</td>
                      <td className="px-4 py-3 font-medium">
                        {p.prenom} {p.nom}
                        {(p.serviceIds?.length ?? 0) > 0 && (
                          <span className="block text-[11px] text-gold font-normal mt-0.5">
                            {p.serviceIds!.map(serviceName).join(" · ")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-mute">{p.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full ${p.type === "ticket" ? "bg-gold/10 text-gold" : "bg-ink/5 text-ink"}`}>
                          {p.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{p.montant > 0 ? `${new Intl.NumberFormat("fr-FR").format(p.montant)} XOF` : "Gratuit"}</td>
                      <td className="px-4 py-3 text-center">
                        {p.checkedIn ? (
                          <CheckCircle2 className="w-4 h-4 text-ok mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-line mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-3 text-mute text-[12px]">{new Date(p.createdAt).toLocaleDateString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}
      </div>
    </section>
  );
}

export default function OrganisateurDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      }
    >
      <OrganisateurDashboardContent />
    </Suspense>
  );
}
