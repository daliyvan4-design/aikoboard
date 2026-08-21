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
import { countryName } from "@/lib/countries";
import {
  ParticipantFileRow,
  estInstitutionnel,
  estInternational,
  type ParticipantFile,
} from "@/components/organisateur/participant-file";

/** Le dossier complet vit avec le composant qui l'affiche. */
type Participant = ParticipantFile;

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
  const [classement, setClassement] = useState<"provenance" | "client" | "tous">("provenance");

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

  const heure = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleString("fr-FR", {
          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        })
      : "—";

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

  // Classement par type de client : l'organisateur prepare l'accueil d'une
  // delegation autrement que celui d'un participant local.
  const groupes: { id: string; titre: string; lead: string; list: Participant[] }[] =
    classement === "provenance"
      ? [
          {
            id: "international",
            titre: "Participants internationaux",
            lead: "Vol, visa, hébergement : accueil à préparer",
            list: filtered.filter(estInternational),
          },
          {
            id: "local",
            titre: "Participants locaux",
            lead: "Sur place, sans formalité d'entrée",
            list: filtered.filter((p) => !estInternational(p)),
          },
        ]
      : classement === "client"
        ? [
            {
              id: "institutionnel",
              titre: "Clients institutionnels",
              lead: "Inscrits au nom d'une organisation ou d'une délégation",
              list: filtered.filter(estInstitutionnel),
            },
            {
              id: "individuel",
              titre: "Clients individuels",
              lead: "Inscrits en leur nom propre",
              list: filtered.filter((p) => !estInstitutionnel(p)),
            },
          ]
        : [
            {
              id: "tous",
              titre: "Tous les participants",
              lead: "Dans l'ordre d'inscription, du plus récent au plus ancien",
              list: filtered,
            },
          ];

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

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
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
              <p className="text-[11px] text-cream/40 uppercase tracking-wider">Internationaux</p>
              <p className="font-serif text-[32px] text-cream">
                {participants.filter((p) => p.typeParticipant === "international").length}
                <span className="text-[14px] text-cream/30 ml-1">/ {participants.length}</span>
              </p>
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

        {/* Participants : dossier complet, classe par type de client */}
        {!accessDenied && (
          <div className="space-y-6">
            <div className="bg-white border border-line rounded-2xl px-5 sm:px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
              <div className="min-w-0">
                <h2 className="font-serif text-[22px] text-ink">Participants</h2>
                <p className="text-[13px] text-mute">
                  {participants.length} inscrit{participants.length > 1 ? "s" : ""}
                  {" · "}
                  {participants.filter(estInternational).length} international
                  {participants.filter(estInternational).length > 1 ? "aux" : ""}
                  {" · "}
                  {participants.filter(estInstitutionnel).length} institutionnel
                  {participants.filter(estInstitutionnel).length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 min-w-0">
                <div className="flex bg-cream2 border border-line rounded-full p-1">
                  {([
                    ["provenance", "Provenance"],
                    ["client", "Type de client"],
                    ["tous", "Tous"],
                  ] as const).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setClassement(id)}
                      className={`text-[12px] rounded-full px-3 py-1.5 transition-colors ${
                        classement === id ? "bg-ink text-cream" : "text-mute hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="bg-cream2 border border-line rounded-xl pl-9 pr-4 py-2.5 text-[13px] w-[200px] min-w-0"
                  />
                </div>

                <button
                  onClick={() => {
                    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
                    const sep = ";";
                    const header = [
                      "N", "Reference", "Type de client", "Provenance", "Prenom", "Nom", "Email",
                      "Telephone", "Organisation", "Titre", "Billet", "Statut", "Montant (XOF)",
                      "Hebergement", "Quartier", "Chambre", "Prix par nuit (XOF)",
                      "Services demandes", "Devis", "Montant devis (XOF)", "Statut devis",
                      "Sejour du", "Sejour au", "Personnes", "Nationalite",
                      "Passeport", "Pays de depart", "Numero de vol", "Visa", "Arrivee", "Retour",
                      "Plan de vol", "Check-in", "Heure check-in", "Date inscription",
                    ].join(sep);

                    const rows = participants.map((p) => {
                      const devis = p.commandes?.[0];
                      return [
                        String(p.ticketNumber).padStart(4, "0"),
                        p.reference,
                        estInstitutionnel(p) ? "Institutionnel" : "Individuel",
                        estInternational(p) ? "International" : "Local",
                        esc(p.prenom),
                        esc(p.nom),
                        p.email,
                        p.telephone,
                        esc(p.organisation ?? ""),
                        esc(p.titre ?? ""),
                        p.type,
                        p.statut,
                        String(p.montant),
                        esc(p.residence?.nom ?? ""),
                        esc([p.residence?.quartier, p.residence?.ville].filter(Boolean).join(", ")),
                        esc(p.residenceTarif?.label ?? ""),
                        p.residenceTarif ? String(p.residenceTarif.prixParNuit) : "",
                        esc((p.serviceIds ?? []).map((id) => serviceName(id)).join(" + ")),
                        devis?.reference ?? "",
                        devis ? String(devis.montantTotal) : "",
                        devis?.statut ?? "",
                        devis ? new Date(devis.dateArrivee).toLocaleDateString("fr-FR") : "",
                        devis ? new Date(devis.dateDepart).toLocaleDateString("fr-FR") : "",
                        devis ? String(devis.nombrePersonnes) : "",
                        esc(devis?.nationalite ? countryName(devis.nationalite) : ""),
                        esc(p.passeport ?? ""),
                        esc(p.paysDepart ? countryName(p.paysDepart) : ""),
                        esc(p.numeroVol ?? ""),
                        p.aVisa === true ? "Oui" : p.aVisa === false ? "Non" : "",
                        p.dateArrivee ? heure(p.dateArrivee) : "",
                        p.dateRetour ? heure(p.dateRetour) : "",
                        esc((p.planVol ?? "").replace(/\r?\n/g, " ")),
                        p.checkedIn ? "Oui" : "Non",
                        p.checkedIn && p.checkedInAt ? heure(p.checkedInAt) : "",
                        new Date(p.createdAt).toLocaleDateString("fr-FR"),
                      ].join(sep);
                    });

                    const bom = "\ufeff";
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

            {participants.length === 0 ? (
              <div className="bg-white border border-line rounded-2xl px-6 py-16 text-center">
                <Users className="w-10 h-10 text-line mx-auto mb-3" />
                <p className="text-mute text-[14px]">Aucun participant pour le moment</p>
              </div>
            ) : (
              groupes.map((g) => (
                <div key={g.id} className="bg-white border border-line rounded-2xl overflow-hidden min-w-0">
                  <div className="px-5 py-4 border-b border-line bg-cream2/50 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 min-w-0">
                    <div className="min-w-0">
                      <h3 className="font-serif text-[18px] text-ink">{g.titre}</h3>
                      <p className="text-[12px] text-mute">{g.lead}</p>
                    </div>
                    <div className="text-[12px] text-mute flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        <strong className="text-ink">{g.list.length}</strong> inscrit
                        {g.list.length > 1 ? "s" : ""}
                      </span>
                      <span>
                        <strong className="text-ink">{g.list.filter((p) => p.checkedIn).length}</strong>{" "}
                        check-in
                      </span>
                      <span>
                        <strong className="text-ink">
                          {new Intl.NumberFormat("fr-FR").format(
                            g.list.reduce((sum, p) => sum + p.montant, 0),
                          )}
                        </strong>{" "}
                        XOF
                      </span>
                    </div>
                  </div>

                  {g.list.length === 0 ? (
                    <p className="px-5 py-10 text-[13px] text-mute text-center">
                      {search ? "Aucun résultat dans cette catégorie" : "Personne dans cette catégorie"}
                    </p>
                  ) : (
                    <div className="divide-y divide-line">
                      {g.list.map((p) => (
                        <ParticipantFileRow key={p.id} participant={p} serviceName={serviceName} />
                      ))}
                    </div>
                  )}
                </div>
              ))
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
