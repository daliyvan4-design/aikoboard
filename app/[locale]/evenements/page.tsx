"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, MapPin, Users, ArrowRight, Loader2, Search } from "lucide-react";

interface EventItem {
  slug: string;
  nom: string;
  type: string;
  lieu: string;
  ville: string;
  dateDebut: string;
  dateFin: string;
  prixBadge: number;
  prixTicket: number;
  coverUrl?: string;
  logoUrl?: string;
  _count: { participants: number };
}

function formatRange(start: string, end: string, locale: string) {
  const loc = locale === "ar" ? "ar-SA" : locale === "en" ? "en-GB" : "fr-FR";
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString(loc, { day: "numeric", month: "long" })} - ${e.toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" })}`;
}

export default function EvenementsPage() {
  const locale = useLocale();
  const t = useTranslations("events");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "conference" | "concert" | "hackathon">("all");

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEvents(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter((evt) => {
    if (filter !== "all" && evt.type !== filter) return false;
    if (search && !evt.nom.toLowerCase().includes(search.toLowerCase()) && !evt.ville.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const upcoming = filtered.filter((e) => new Date(e.dateFin) >= new Date());
  const past = filtered.filter((e) => new Date(e.dateFin) < new Date());

  return (
    <section className="animate-fade-up">
      <div className="bg-ink text-cream">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 pt-20 pb-12">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cream/40 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span>{t("eyebrow")}</span>
          </div>
          <h1 className="font-serif text-[36px] sm:text-[52px] text-cream leading-tight">
            {t("title")}
          </h1>
          <p className="mt-4 text-[16px] text-cream/50 max-w-xl">{t("subtitle")}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_placeholder")}
              className="w-full bg-cream2 border border-line rounded-xl pl-10 pr-4 py-3 text-[14px] focus:border-gold focus:ring-1 focus:ring-gold/30"
            />
          </div>
          {/* Les filtres passent a la ligne plutot que de deborder de
              l'ecran : a 360 px ils depassaient de 41 px, poussant toute
              la page vers un scroll horizontal. */}
          <div className="flex flex-wrap gap-2">
            {(["all", "conference", "concert", "hackathon"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all ${
                  filter === f
                    ? "bg-gold text-ink"
                    : "bg-cream2 text-mute hover:text-ink border border-line"
                }`}
              >
                {t(`filter_${f}`)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : upcoming.length === 0 && past.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-mute/30 mx-auto mb-4" />
            <p className="text-mute text-[15px]">{t("no_events")}</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="mb-12">
                <h2 className="text-[11px] uppercase tracking-[0.18em] text-mute font-semibold mb-6">
                  {t("upcoming")} ({upcoming.length})
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {upcoming.map((evt) => (
                    <Link
                      key={evt.slug}
                      href={`/${locale}/evenements/${evt.slug}`}
                      className="bg-white border border-line rounded-2xl overflow-hidden hover:shadow-float transition-all group"
                    >
                      <div className="relative h-44 bg-cream2">
                        {evt.coverUrl ? (
                          <Image src={evt.coverUrl} alt={evt.nom} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Calendar size={44} className="text-mute/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
                        <div className="absolute top-3 right-3">
                          <span className="text-[10px] uppercase tracking-wider text-ink bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full font-medium">
                            {t(`type_${evt.type}`)}
                          </span>
                        </div>
                        {evt.logoUrl && (
                          <div className="absolute bottom-3 left-3">
                            <Image src={evt.logoUrl} alt="" width={40} height={40} className="rounded-lg object-cover border-2 border-white shadow-sm" />
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="font-serif text-[18px] text-ink leading-tight mb-2 group-hover:text-gold transition-colors">
                          {evt.nom}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[12px] text-mute mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatRange(evt.dateDebut, evt.dateFin, locale)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-mute/60">
                          <MapPin className="w-3.5 h-3.5" />
                          {evt.lieu} · {evt.ville}
                        </div>
                        <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
                          <span className="text-[12px] text-mute flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {evt._count.participants} {t("registered")}
                          </span>
                          <span className="text-[12px] text-gold font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            {t("register")} <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="text-[11px] uppercase tracking-[0.18em] text-mute font-semibold mb-6">
                  {t("past")} ({past.length})
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 opacity-60">
                  {past.map((evt) => (
                    <Link
                      key={evt.slug}
                      href={`/${locale}/evenements/${evt.slug}`}
                      className="bg-white border border-line rounded-2xl overflow-hidden group"
                    >
                      <div className="relative h-36 bg-cream2">
                        {evt.coverUrl ? (
                          <Image src={evt.coverUrl} alt={evt.nom} fill className="object-cover grayscale" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Calendar size={36} className="text-mute/20" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span className="text-[10px] uppercase tracking-wider text-mute bg-white/80 px-2.5 py-1 rounded-full">
                            {t("ended")}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-serif text-[16px] text-ink leading-tight mb-1">{evt.nom}</h3>
                        <p className="text-[11px] text-mute">{formatRange(evt.dateDebut, evt.dateFin, locale)}</p>
                        <p className="text-[11px] text-mute/60 mt-1">{evt._count.participants} {t("participants")}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
