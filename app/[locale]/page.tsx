"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Calendar, Users, Ticket, QrCode, Plus, ArrowRight, Loader2 } from "lucide-react";

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
  return `${s.toLocaleDateString(loc, { day: "numeric", month: "long" })} — ${e.toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" })}`;
}

function EventCard({ evt, locale, variant, t }: { evt: EventItem; locale: string; variant: "dark" | "light"; t: (key: string) => string }) {
  const price = evt.prixTicket || evt.prixBadge;
  const typeLabel = evt.type === "concert" ? t("concert") : evt.type === "hackathon" ? t("tech") : t("conference");

  if (variant === "dark") {
    return (
      <Link
        href={`/${locale}/evenements/${evt.slug}`}
        className="bg-cream/[0.04] border border-cream/[0.08] rounded-2xl overflow-hidden hover:bg-cream/[0.08] hover:border-cream/[0.15] transition-all group"
      >
        <div className="relative h-40 bg-cream/[0.06]">
          {evt.coverUrl ? (
            <Image src={evt.coverUrl} alt={evt.nom} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar size={40} className="text-cream/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
          <div className="absolute top-3 right-3">
            <span className="text-[10px] uppercase tracking-wider text-cream/80 bg-ink/60 backdrop-blur-sm px-2.5 py-1 rounded-full">{typeLabel}</span>
          </div>
          {evt.logoUrl && (
            <div className="absolute bottom-3 left-3">
              <Image src={evt.logoUrl} alt="" width={36} height={36} className="rounded-lg object-cover border border-cream/20" />
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="font-serif text-[17px] text-cream leading-tight mb-2 group-hover:text-gold transition-colors">
            {evt.nom}
          </h3>
          <p className="text-[12px] text-cream/40">{formatRange(evt.dateDebut, evt.dateFin, locale)}</p>
          <p className="text-[11px] text-cream/30 mt-1">{evt.lieu} · {evt.ville}</p>
          <div className="mt-4 pt-3 border-t border-cream/[0.06] flex items-center justify-between">
            <span className="text-[11px] text-cream/40 mono">{evt._count.participants} {t("registered")}</span>
            <span className="text-[11px] text-gold font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              {t("register")} <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
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
            {typeLabel}
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
        <p className="text-[13px] text-mute">{formatRange(evt.dateDebut, evt.dateFin, locale)}</p>
        <p className="text-[12px] text-mute/60 mt-1">{evt.lieu} · {evt.ville}</p>
        <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
          <span className="text-[12px] text-mute mono">{evt._count.participants} {t("participants")}</span>
          <span className="text-[12px] text-gold font-medium">
            {price === 0 ? t("free") : `${new Intl.NumberFormat("fr-FR").format(price)} XOF`}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function LandingPage() {
  const locale = useLocale();
  const t = useTranslations("home");
  const [tab, setTab] = useState<"participer" | "creer">("participer");
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

  const pricing = [
    { label: t("price1_label"), price: t("price1_value"), equiv: t("price1_equiv"), sub: t("price1_sub") },
    { label: t("price2_label"), price: t("price2_value"), equiv: t("price2_equiv"), sub: t("price2_sub") },
    { label: t("price3_label"), price: t("price3_value"), equiv: t("price3_equiv"), sub: t("price3_sub") },
  ];

  return (
    <section className="animate-fade-up">
      {/* Hero */}
      <div className="bg-ink text-cream">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 pt-20 lg:pt-28 pb-20">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cream/40 mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span>{t("eyebrow")}</span>
          </div>

          <h1 className="font-serif text-[44px] sm:text-[60px] lg:text-[80px] leading-[1.02] font-normal max-w-4xl">
            {t("h1_pre")}{" "}
            <em className="text-gold not-italic">{t("h1_highlight")}</em>.
          </h1>
          <p className="mt-8 text-[17px] text-cream/60 max-w-xl leading-relaxed">
            {t("lead")}
          </p>

          {/* Tabs */}
          <div className="mt-14 inline-flex bg-cream/5 border border-cream/10 rounded-full p-1">
            <button
              onClick={() => setTab("participer")}
              className={`rounded-full px-6 py-3 text-[14px] font-medium transition-all ${
                tab === "participer"
                  ? "bg-gold text-ink"
                  : "text-cream/60 hover:text-cream"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2 -mt-0.5" />
              {t("tab_participate")}
            </button>
            <button
              onClick={() => setTab("creer")}
              className={`rounded-full px-6 py-3 text-[14px] font-medium transition-all ${
                tab === "creer"
                  ? "bg-gold text-ink"
                  : "text-cream/60 hover:text-cream"
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2 -mt-0.5" />
              {t("tab_create")}
            </button>
          </div>

          {/* Tab content */}
          <div className="mt-10">
            {tab === "participer" && (
              <div className="animate-fade-up">
                <p className="text-cream/50 text-[14px] mb-6">
                  {t("participate_lead")}
                </p>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 text-gold animate-spin" />
                  </div>
                ) : events.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {events.map((evt) => (
                      <EventCard key={evt.slug} evt={evt} locale={locale} variant="dark" t={t} />
                    ))}
                  </div>
                ) : (
                  <p className="text-cream/30 text-[14px] py-8 text-center">{t("no_events")}</p>
                )}
              </div>
            )}

            {tab === "creer" && (
              <div className="animate-fade-up max-w-2xl">
                <p className="text-cream/50 text-[14px] mb-6">
                  {t("create_lead")}
                </p>
                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  <div className="bg-cream/[0.04] border border-cream/[0.08] rounded-2xl p-5 text-center">
                    <Calendar className="w-8 h-8 text-gold mx-auto mb-3" />
                    <p className="text-[13px] text-cream font-medium">{t("step1_title")}</p>
                    <p className="text-[11px] text-cream/40 mt-1">{t("step1_sub")}</p>
                  </div>
                  <div className="bg-cream/[0.04] border border-cream/[0.08] rounded-2xl p-5 text-center">
                    <QrCode className="w-8 h-8 text-gold mx-auto mb-3" />
                    <p className="text-[13px] text-cream font-medium">{t("step2_title")}</p>
                    <p className="text-[11px] text-cream/40 mt-1">{t("step2_sub")}</p>
                  </div>
                  <div className="bg-cream/[0.04] border border-cream/[0.08] rounded-2xl p-5 text-center">
                    <Ticket className="w-8 h-8 text-gold mx-auto mb-3" />
                    <p className="text-[13px] text-cream font-medium">{t("step3_title")}</p>
                    <p className="text-[11px] text-cream/40 mt-1">{t("step3_sub")}</p>
                  </div>
                </div>
                <Link
                  href={`/${locale}/evenements/creer`}
                  className="btn-press inline-flex items-center gap-2.5 bg-gold hover:bg-gold2 text-ink rounded-full px-8 py-4 text-[15px] font-semibold"
                >
                  {t("cta_create")} — 32 800 FCFA
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Events en cours */}
      <div id="participer" className="max-w-7xl mx-auto px-5 lg:px-10 py-20">
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-mute mb-10">
          <span className="dot bg-gold" />
          <span>{t("events_section")}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-mute animate-spin" />
          </div>
        ) : events.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((evt) => (
              <EventCard key={evt.slug} evt={evt} locale={locale} variant="light" t={t} />
            ))}
          </div>
        ) : (
          <p className="text-mute text-[14px] py-8 text-center">{t("no_events")}</p>
        )}
      </div>

      {/* Pricing */}
      <div id="tarifs" className="bg-ink text-cream">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-20">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cream/40 mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span>{t("pricing_eyebrow")}</span>
          </div>

          <h2 className="font-serif text-[36px] sm:text-[48px] text-cream mb-12">
            {t("pricing_h2_pre")} <em className="text-gold not-italic">{t("pricing_h2_highlight")}</em>.
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {pricing.map((p) => (
              <div key={p.label} className="bg-cream/[0.04] border border-cream/[0.08] rounded-2xl p-8">
                <p className="text-[12px] uppercase tracking-wider text-cream/40 mb-4">{p.label}</p>
                <p className="font-serif text-[48px] text-gold leading-none">{p.price}</p>
                {p.equiv && (
                  <p className="text-[13px] text-cream/30 mt-2">{p.equiv}</p>
                )}
                <p className="text-[13px] text-cream/50 mt-3">{p.sub}</p>
              </div>
            ))}
          </div>

          <p className="text-[13px] text-cream/30 mt-8">
            {t("pricing_note")}
          </p>
        </div>
      </div>
    </section>
  );
}
