"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import {
  Calendar,
  Users,
  Ticket,
  QrCode,
  ArrowRight,
  Loader2,
  ScanLine,
  Shield,
  Zap,
  Globe,
  BadgeCheck,
  Smartphone,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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

function BadgeMockup() {
  return (
    <div className="relative">
      <div className="w-[220px] sm:w-[260px] rounded-xl overflow-hidden shadow-2xl" style={{ background: "#0A1628" }}>
        <div style={{ height: 3, background: "#C8A951" }} />
        <div className="px-4 pt-3 flex items-start justify-between">
          <div>
            <p className="text-[8px] text-white/90 font-bold">AVCA Conference</p>
            <p className="text-[6px] text-white/40">& VC Summit 2026</p>
          </div>
          <span className="text-[6px] font-bold px-1.5 py-0.5 rounded-sm" style={{ background: "#C8A951", color: "#0A1628" }}>DELEGATE</span>
        </div>
        <div style={{ height: 1, background: "#1E2D41", margin: "6px 16px" }} />
        <div className="px-4 flex gap-2.5 pb-2">
          <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ border: "1px solid #C8A951", background: "#1E2D41" }}>
            <span className="text-[5px]" style={{ color: "#A0A5AF" }}>PHOTO</span>
          </div>
          <div>
            <p className="text-[12px] text-white font-bold leading-tight">Amadou Diallo</p>
            <p className="text-[6px] font-bold mt-0.5" style={{ color: "#C8A951" }}>MANAGING DIRECTOR</p>
            <p className="text-[7px] mt-0.5" style={{ color: "#A0A5AF" }}>AIKO Group</p>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #1E2D41" }}>
          <div className="px-4 py-1.5 flex items-center justify-between">
            <p className="text-[5.5px]" style={{ color: "#A0A5AF" }}>&#9675; Abidjan &middot; 11-17 mars 2026</p>
            <div className="flex items-center gap-1">
              <span className="text-[5px] font-bold" style={{ color: "#C8A951" }}>N&deg;</span>
              <span className="text-[9px] text-white font-bold font-mono">0042</span>
            </div>
          </div>
        </div>
        <div style={{ height: 3, background: "#C8A951" }} />
      </div>

      {/* Floating QR */}
      <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-xl shadow-xl flex items-center justify-center" style={{ background: "#0A1628", border: "2px solid #C8A95130" }}>
        <QRCodeSVG
          value="AIKO-X7K2M9"
          size={54}
          bgColor="transparent"
          fgColor="#C8A951"
          level="L"
        />
      </div>
    </div>
  );
}

function EventCard({ evt, locale, t }: { evt: EventItem; locale: string; t: (key: string) => string }) {
  const price = evt.prixTicket || evt.prixBadge;
  const typeLabel = evt.type === "concert" ? t("concert") : evt.type === "hackathon" ? t("tech") : t("conference");

  return (
    <Link
      href={`/${locale}/evenements/${evt.slug}`}
      className="group bg-white rounded-2xl border border-line overflow-hidden hover:shadow-lg hover:border-gold/20 transition-all duration-300"
    >
      <div className="relative h-40 bg-cream2">
        {evt.coverUrl ? (
          <Image src={evt.coverUrl} alt={evt.nom} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink/5 to-ink/10">
            <Calendar size={36} className="text-ink/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="text-[10px] uppercase tracking-wider text-white bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full font-medium">
            {typeLabel}
          </span>
        </div>
        {evt.logoUrl && (
          <div className="absolute bottom-3 left-3">
            <Image src={evt.logoUrl} alt="" width={36} height={36} className="rounded-lg object-cover border-2 border-white/30" />
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-[16px] font-serif text-ink leading-snug mb-2 group-hover:text-gold transition-colors">
          {evt.nom}
        </h3>
        <div className="flex items-center gap-1.5 text-[12px] text-mute mb-1">
          <Calendar size={12} className="text-gold shrink-0" />
          {formatRange(evt.dateDebut, evt.dateFin, locale)}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-mute/60">
          <Globe size={11} className="text-mute/40 shrink-0" />
          {evt.lieu} &middot; {evt.ville}
        </div>
        <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
          <span className="text-[11px] text-mute mono flex items-center gap-1.5">
            <Users size={12} className="text-mute/50" />
            {evt._count.participants} {t("participants")}
          </span>
          <span className="text-[12px] font-semibold text-gold flex items-center gap-1 group-hover:gap-2 transition-all">
            {price === 0 ? t("free") : `${new Intl.NumberFormat("fr-FR").format(price)} XOF`}
            <ArrowRight size={13} />
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

  const pricing = [
    { label: t("price1_label"), price: t("price1_value"), equiv: t("price1_equiv"), sub: t("price1_sub"), icon: Calendar },
    { label: t("price2_label"), price: t("price2_value"), equiv: t("price2_equiv"), sub: t("price2_sub"), icon: BadgeCheck },
    { label: t("price3_label"), price: t("price3_value"), equiv: t("price3_equiv"), sub: t("price3_sub"), icon: Ticket },
  ];

  return (
    <section>
      {/* ─── Hero ─── */}
      <div className="bg-ink text-cream overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 pt-16 lg:pt-24 pb-20 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                <span className="text-[11px] uppercase tracking-[0.15em] text-gold font-medium">{t("eyebrow")}</span>
              </div>

              <h1 className="font-serif text-[40px] sm:text-[52px] lg:text-[64px] leading-[1.05] font-normal">
                {t("h1_pre")}{" "}
                <em className="text-gold not-italic">{t("h1_highlight")}</em>.
              </h1>
              <p className="mt-6 text-[16px] text-cream/55 max-w-lg leading-relaxed">
                {t("lead")}
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href={`/${locale}/evenements/creer`}
                  className="btn-press inline-flex items-center gap-2.5 bg-gold hover:bg-gold2 text-ink rounded-full px-7 py-3.5 text-[14px] font-semibold transition-colors"
                >
                  {t("cta_create")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#participer"
                  className="inline-flex items-center gap-2 text-cream/60 hover:text-cream border border-cream/15 hover:border-cream/30 rounded-full px-7 py-3.5 text-[14px] font-medium transition-all"
                >
                  <Users className="w-4 h-4" />
                  {t("tab_participate")}
                </Link>
              </div>

              {/* Trust numbers */}
              <div className="mt-12 flex items-center gap-8">
                <div>
                  <p className="text-[28px] font-serif text-gold">100%</p>
                  <p className="text-[11px] text-cream/35 mt-0.5">Mobile-friendly</p>
                </div>
                <div className="w-px h-10 bg-cream/10" />
                <div>
                  <p className="text-[28px] font-serif text-gold">&lt;2min</p>
                  <p className="text-[11px] text-cream/35 mt-0.5">Pour creer un event</p>
                </div>
                <div className="w-px h-10 bg-cream/10" />
                <div>
                  <p className="text-[28px] font-serif text-gold">QR</p>
                  <p className="text-[11px] text-cream/35 mt-0.5">Scan instantane</p>
                </div>
              </div>
            </div>

            {/* Badge visual */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative">
                <div className="absolute -inset-20 bg-gold/5 rounded-full blur-3xl" />
                <BadgeMockup />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── How it works ─── */}
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-20 lg:py-28">
        <div className="text-center mb-14">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold font-medium mb-3">{t("create_lead").split(".")[0]}</p>
          <h2 className="font-serif text-[32px] sm:text-[40px] text-ink">
            Comment ca marche
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 lg:gap-10">
          {[
            { icon: Calendar, step: "01", title: t("step1_title"), sub: t("step1_sub"), color: "bg-gold/8" },
            { icon: QrCode, step: "02", title: t("step2_title"), sub: t("step2_sub"), color: "bg-gold/8" },
            { icon: ScanLine, step: "03", title: t("step3_title"), sub: t("step3_sub"), color: "bg-gold/8" },
          ].map((s) => (
            <div key={s.step} className="relative group">
              <div className="bg-white border border-line rounded-2xl p-7 hover:border-gold/20 hover:shadow-lg transition-all duration-300 h-full">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-ink flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-[32px] font-serif text-gold/20 font-bold">{s.step}</span>
                </div>
                <h3 className="text-[17px] font-serif text-ink mb-2">{s.title}</h3>
                <p className="text-[13px] text-mute leading-relaxed">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Arrow to CTA */}
        <div className="text-center mt-10">
          <Link
            href={`/${locale}/evenements/creer`}
            className="btn-press inline-flex items-center gap-2.5 bg-ink hover:bg-ink2 text-cream rounded-full px-8 py-4 text-[14px] font-semibold transition-colors"
          >
            {t("cta_create")} — 32 800 FCFA
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ─── Features ─── */}
      <div className="bg-ink text-cream">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-gold font-medium mb-3">Tout-en-un</p>
              <h2 className="font-serif text-[32px] sm:text-[40px] text-cream mb-6">
                Tout ce qu&apos;il faut pour vos evenements
              </h2>
              <p className="text-[15px] text-cream/50 leading-relaxed mb-10">
                De la creation a l&apos;accreditation, AIKO Board gere chaque etape.
              </p>

              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  { icon: BadgeCheck, label: "Badges PVC", desc: "Design pro avec photo et QR code" },
                  { icon: Smartphone, label: "Paiement mobile", desc: "GeniusPay, Wave, Orange Money" },
                  { icon: ScanLine, label: "Scan QR", desc: "Check-in instantane sur mobile" },
                  { icon: Shield, label: "Securise", desc: "Donnees chiffrees, anti-fraude" },
                  { icon: Zap, label: "Temps reel", desc: "Stats et suivi en direct" },
                  { icon: Globe, label: "Multilingue", desc: "Francais, anglais, arabe" },
                ].map((f) => (
                  <div key={f.label} className="flex items-start gap-3 p-4 rounded-xl bg-cream/[0.04] border border-cream/[0.06]">
                    <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                      <f.icon className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-[14px] text-cream font-medium">{f.label}</p>
                      <p className="text-[12px] text-cream/40 mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone mockup */}
            <div className="hidden lg:flex justify-center">
              <div className="relative w-[280px] h-[480px] bg-ink2 rounded-[36px] border-2 border-cream/10 p-3 shadow-2xl">
                <div className="bg-cream rounded-[28px] h-full overflow-hidden flex flex-col">
                  {/* Phone screen content */}
                  <div className="bg-ink px-5 pt-5 pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] text-gold font-bold tracking-wider">AIKO BOARD</span>
                      <span className="text-[8px] text-cream/40">Scanner</span>
                    </div>
                    <div className="bg-cream/10 rounded-xl p-4 flex items-center justify-center">
                      <ScanLine className="w-12 h-12 text-gold/60" />
                    </div>
                  </div>
                  <div className="flex-1 bg-cream2 p-4">
                    <div className="bg-white rounded-xl p-4 border border-line shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                          <BadgeCheck className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-[11px] text-green-700 font-semibold">Valide</span>
                      </div>
                      <p className="text-[13px] text-ink font-semibold">Amadou Diallo</p>
                      <p className="text-[10px] text-mute mt-0.5">Badge N° 0042 &middot; DELEGATE</p>
                      <div className="mt-2 pt-2 border-t border-line">
                        <p className="text-[9px] text-mute">AIKO-X7K2M9</p>
                      </div>
                    </div>
                    <div className="mt-3 bg-white rounded-xl p-3 border border-line shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-mute">Scannes aujourd&apos;hui</p>
                        <p className="text-[18px] text-ink font-serif font-bold">127</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-mute">Total inscrits</p>
                        <p className="text-[18px] text-ink font-serif font-bold">342</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Events ─── */}
      <div id="participer" className="max-w-7xl mx-auto px-5 lg:px-10 py-20 lg:py-28">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold font-medium mb-3">{t("events_section")}</p>
            <h2 className="font-serif text-[32px] sm:text-[40px] text-ink">
              {t("tab_participate")}
            </h2>
          </div>
          <Link
            href={`/${locale}/evenements`}
            className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-gold hover:text-gold2 font-medium transition-colors"
          >
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-gold animate-spin" />
          </div>
        ) : events.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <EventCard key={evt.slug} evt={evt} locale={locale} t={t} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-cream2 rounded-2xl border border-line">
            <Calendar className="w-10 h-10 text-mute/30 mx-auto mb-4" />
            <p className="text-mute text-[15px] font-medium">{t("no_events")}</p>
            <p className="text-mute/60 text-[13px] mt-1">Les prochains evenements apparaitront ici</p>
          </div>
        )}
      </div>

      {/* ─── Pricing ─── */}
      <div id="tarifs" className="bg-cream2 border-t border-b border-line">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-20 lg:py-28">
          <div className="text-center mb-14">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold font-medium mb-3">{t("pricing_eyebrow")}</p>
            <h2 className="font-serif text-[32px] sm:text-[40px] text-ink">
              {t("pricing_h2_pre")} <em className="text-gold not-italic">{t("pricing_h2_highlight")}</em>.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricing.map((p, i) => (
              <div
                key={p.label}
                className={`relative bg-white rounded-2xl p-7 border transition-all duration-300 hover:shadow-lg ${
                  i === 0 ? "border-gold shadow-md ring-1 ring-gold/20" : "border-line hover:border-gold/20"
                }`}
              >
                {i === 0 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] uppercase tracking-wider text-ink bg-gold px-3 py-1 rounded-full font-semibold">Populaire</span>
                  </div>
                )}
                <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center mb-5">
                  <p.icon className="w-5 h-5 text-gold" />
                </div>
                <p className="text-[11px] uppercase tracking-wider text-mute mb-3 font-medium">{p.label}</p>
                <p className="font-serif text-[36px] text-ink leading-none">{p.price}</p>
                {p.equiv && (
                  <p className="text-[12px] text-mute/60 mt-1">{p.equiv}</p>
                )}
                <p className="text-[13px] text-mute mt-4 leading-relaxed">{p.sub}</p>
              </div>
            ))}
          </div>

          <p className="text-[12px] text-mute/60 mt-8 text-center max-w-lg mx-auto">
            {t("pricing_note")}
          </p>
        </div>
      </div>

      {/* ─── Final CTA ─── */}
      <div className="bg-ink text-cream">
        <div className="max-w-3xl mx-auto px-5 lg:px-10 py-20 lg:py-28 text-center">
          <h2 className="font-serif text-[32px] sm:text-[44px] text-cream leading-tight">
            Pret a lancer votre prochain evenement ?
          </h2>
          <p className="mt-4 text-[15px] text-cream/50 max-w-md mx-auto">
            Creez votre evenement en moins de 2 minutes et commencez a accueillir vos participants.
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
              className="inline-flex items-center gap-2 text-cream/60 hover:text-cream border border-cream/15 hover:border-cream/30 rounded-full px-8 py-4 text-[15px] font-medium transition-all"
            >
              Voir les evenements
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
