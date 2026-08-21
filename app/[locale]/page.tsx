"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Hero } from "@/components/home/hero";
import {
  Calendar,
  Users,
  ArrowRight,
  Loader2,
  Globe,
  QrCode,
  ScanLine,
} from "lucide-react";
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

function EventCard({ evt, locale, t }: { evt: EventItem; locale: string; t: (key: string) => string }) {
  const price = evt.prixTicket || evt.prixBadge;
  const typeLabel = evt.type === "concert" ? t("concert") : evt.type === "hackathon" ? t("tech") : t("conference");

  return (
    <Link
      href={`/${locale}/evenements/${evt.slug}`}
      className="group bg-white rounded-2xl border border-line overflow-hidden hover:shadow-lg hover:border-gold/20 transition-all duration-300"
    >
      <div className="relative h-44 bg-cream2 overflow-hidden">
        {evt.coverUrl ? (
          <Image src={evt.coverUrl} alt={evt.nom} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink/[0.03] to-ink/[0.08]">
            <Calendar size={36} className="text-ink/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="text-[11px] text-white bg-black/40 backdrop-blur-md px-2.5 py-1 rounded font-medium">
            {typeLabel}
          </span>
        </div>
        {evt.logoUrl && (
          <div className="absolute bottom-3 left-3">
            <Image src={evt.logoUrl} alt="" width={36} height={36} className="rounded-lg object-cover border-2 border-white/20" />
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-[16px] font-serif text-ink leading-snug mb-3 group-hover:text-gold transition-colors">
          {evt.nom}
        </h3>
        <p className="text-[13px] text-mute flex items-center gap-1.5 mb-1">
          <Calendar size={13} className="text-gold/70 shrink-0" />
          {formatRange(evt.dateDebut, evt.dateFin, locale)}
        </p>
        <p className="text-[12px] text-mute/60 flex items-center gap-1.5">
          <Globe size={12} className="text-mute/40 shrink-0" />
          {evt.lieu} &middot; {evt.ville}
        </p>
        <div className="mt-4 pt-3 border-t border-line/50 flex items-center justify-between">
          <span className="text-[12px] text-mute flex items-center gap-1.5" style={{ fontVariantNumeric: "tabular-nums" }}>
            <Users size={13} className="text-mute/50" />
            {evt._count.participants} {t("participants")}
          </span>
          <span className="text-[13px] font-semibold text-gold flex items-center gap-1 group-hover:gap-2 transition-all">
            {price === 0 ? t("free") : `${new Intl.NumberFormat("fr-FR").format(price)} XOF`}
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function LandingPage() {
  const locale = useLocale();
  const t = useTranslations("home");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data.length > 0) setEvents(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <Hero locale={locale} t={t} />

      {/* ─── COMMENT CA MARCHE ─── */}
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-24 lg:py-32">
        <h2 className="font-serif text-[30px] sm:text-[38px] text-ink mb-16 max-w-md">
          {t("how_title")}
        </h2>

        <div className="grid md:grid-cols-3 gap-x-12 gap-y-10">
          {[
            { icon: Calendar, title: t("step1_title"), desc: t("step1_desc") },
            { icon: QrCode, title: t("step2_title"), desc: t("step2_desc") },
            { icon: ScanLine, title: t("step3_title"), desc: t("step3_desc") },
          ].map((s) => (
            <div key={s.title}>
              <s.icon className="w-6 h-6 text-gold mb-5" strokeWidth={1.5} />
              <h3 className="text-[18px] font-semibold text-ink mb-3">{s.title}</h3>
              <p className="text-[15px] text-mute leading-[1.7]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── EVENTS ─── */}
      <div id="participer" className="bg-cream2 border-t border-line">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-24 lg:py-32">
          <div className="flex items-end justify-between mb-12">
            <h2 className="font-serif text-[30px] sm:text-[38px] text-ink">
              {t("events_section")}
            </h2>
            <Link
              href={`/${locale}/evenements`}
              className="hidden sm:inline-flex items-center gap-1.5 text-[14px] text-gold hover:text-gold2 font-medium transition-colors"
            >
              {t("see_all")} <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 text-gold animate-spin" />
            </div>
          ) : events.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((evt) => (
                <EventCard key={evt.slug} evt={evt} locale={locale} t={t} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-[16px] text-mute">{t("no_events")}</p>
              <p className="text-[14px] text-mute/50 mt-2">{t("no_events_hint")}</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── FINAL CTA ─── */}
      <div className="bg-ink text-cream">
        <div className="max-w-4xl mx-auto px-5 lg:px-10 py-24 lg:py-32 text-center">
          <h2 className="font-serif text-[30px] sm:text-[40px] lg:text-[48px] text-cream leading-tight">
            {t("final_title")}
          </h2>
          <p className="mt-5 text-[16px] text-cream/45 max-w-lg mx-auto leading-[1.7]">
            {t("final_lead")}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/evenements/creer`}
              className="btn-press inline-flex items-center gap-2.5 bg-gold hover:bg-gold2 text-ink rounded-full px-8 py-4 text-[15px] font-semibold transition-colors"
            >
              {t("cta_create")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#participer"
              className="inline-flex items-center gap-2 text-cream/50 hover:text-cream border border-cream/12 hover:border-cream/25 rounded-full px-8 py-4 text-[15px] transition-all"
            >
              {t("final_secondary")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
