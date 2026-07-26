"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Printer,
  Download,
  Ticket,
  Loader2,
  Bed,
  Star,
  Car,
  Sparkles,
  RotateCw,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { PaymentButton } from "@/components/payment/payment-button";
import { generateTicketPDF } from "@/lib/generate-ticket-pdf";
import { generateSingleBadgePDF } from "@/lib/generate-badge-pdf";
import { EventMap } from "@/components/ui/event-map";

interface ResidenceTarif {
  id: string;
  label: string;
  typeChambre: string;
  prixParNuit: number;
  devise: string;
  capacite: number;
}

interface ResidenceData {
  id: string;
  nom: string;
  type: string;
  description?: string;
  adresse: string;
  ville: string;
  quartier?: string;
  equipements?: string;
  images: { url: string; legende?: string }[];
  tarifs: ResidenceTarif[];
}

interface EventData {
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
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  coverUrl?: string;
  offreLogement?: boolean;
  offreVehicule?: boolean;
  offreExtras?: boolean;
  residence?: ResidenceData | null;
  _count: { participants: number };
}


function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  return `${s.toLocaleDateString("fr-FR", { day: "numeric" })} — ${e.toLocaleDateString("fr-FR", opts)}`;
}

export default function EventPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("event.page");
  const ts = useTranslations("event.success");
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<"info" | "form" | "done">("info");
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    organisation: "",
    useForBadge: true,
  });
  const [ref, setRef] = useState("");
  const [ticketNum, setTicketNum] = useState(0);
  const [payError, setPayError] = useState("");
  const [selectedTarifId, setSelectedTarifId] = useState<string | null>(null);
  const [showVerso, setShowVerso] = useState(false);

  const hasLogement = event?.offreLogement && event.residence && event.residence.tarifs.length > 0;
  const selectedTarif = hasLogement ? event!.residence!.tarifs.find((t) => t.id === selectedTarifId) : null;

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEvent(d.data);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

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
        <p className="text-mute text-[16px]">{t("not_found")}</p>
        <Link href={`/${locale}`} className="text-gold mt-4 inline-block">
          {t("return")}
        </Link>
      </div>
    );
  }

  const isConcert = event.type === "concert";
  const price = isConcert ? event.prixTicket : event.prixBadge;
  const isFree = price === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFree) return;

    try {
      const res = await fetch(`/api/events/${event.slug}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: form.prenom,
          nom: form.nom,
          email: form.email,
          telephone: form.telephone,
          organisation: form.organisation,
          type: isConcert ? "ticket" : "badge",
          montant: 0,
          residenceTarifId: selectedTarifId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRef(data.data.reference);
        setTicketNum(data.data.ticketNumber);
      } else {
        setRef(`AIKO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
      }
    } catch {
      setRef(`AIKO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    }

    setStep("done");
  };

  const saveParticipantBeforePay = async (): Promise<{ participantRef?: string; eventSlug?: string }> => {
    try {
      const res = await fetch(`/api/events/${event.slug}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: form.prenom,
          nom: form.nom,
          email: form.email,
          telephone: form.telephone,
          organisation: form.organisation,
          type: isConcert ? "ticket" : "badge",
          statut: "pending",
          montant: price,
          residenceTarifId: selectedTarifId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        return { participantRef: data.data.reference, eventSlug: event.slug };
      }
    } catch {
      // continue to payment anyway
    }
    return { eventSlug: event.slug };
  };

  if (step === "done") {
    const displayRef = ref || `AIKO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return (
      <section className="animate-fade-up">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 pt-10 pb-24">
          <div className="text-center mb-12">
            <CheckCircle2 className="w-16 h-16 text-ok mx-auto mb-5" />
            <h2 className="font-serif text-[36px] sm:text-[44px] text-ink">
              {isConcert ? ts("confirmed_ticket") : ts("confirmed_badge")}
            </h2>
            <p className="text-mute mt-3 text-[16px] max-w-lg mx-auto">
              {form.prenom}, votre {isConcert ? t("ticket") : t("badge")} pour <strong>{event.nom}</strong> {ts("ready")}
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            {/* Badge recto/verso for conference/hackathon */}
            {!isConcert && (
              <div className="relative">
                <div className="w-[380px] bg-ink rounded-2xl overflow-hidden shadow-float" id="badge-print">
                  {!showVerso ? (
                    <>
                      {/* RECTO */}
                      <div className="bg-gold px-6 py-4 flex items-center justify-between">
                        {event.logoUrl && (
                          <Image src={event.logoUrl} alt="" width={28} height={28} className="rounded-md object-cover" />
                        )}
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#0A0A0A", letterSpacing: "0.04em" }}>AIKO</span>
                        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#0A0A0A", fontWeight: 600 }}>{t("badge")}</span>
                      </div>

                      {event.coverUrl && (
                        <div className="mx-5 mt-4 rounded-lg overflow-hidden">
                          <Image src={event.coverUrl} alt="" width={340} height={100} className="w-full h-[100px] object-cover" />
                        </div>
                      )}

                      <div className="px-6 py-4">
                        <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>Evenement</p>
                        <p style={{ fontSize: 15, color: "#C8A951", fontWeight: 600, marginTop: 4 }}>{event.nom}</p>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{formatDateRange(event.dateDebut, event.dateFin)}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{event.lieu} · {event.ville}</p>
                      </div>

                      <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 24px" }} />

                      <div className="px-6 pt-4 pb-3">
                        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#fff", lineHeight: 1.2 }}>
                          {form.prenom} {form.nom}
                        </p>
                        {form.organisation && (
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{form.organisation}</p>
                        )}
                      </div>

                      <div className="px-6 pb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 9, color: "#C8A951", fontWeight: 600 }}>N°</span>
                          <span style={{ fontSize: 16, color: "#fff", fontWeight: 700, fontFamily: "monospace" }}>{String(ticketNum || 1).padStart(4, "0")}</span>
                        </div>
                        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.15em" }}>{event.type.toUpperCase()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* VERSO */}
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="py-4">
                          <QRCodeSVG
                            value={JSON.stringify({
                              ref: displayRef,
                              event: event.nom,
                              name: `${form.prenom} ${form.nom}`,
                              email: form.email,
                              type: "badge",
                              ticket: ticketNum,
                            })}
                            size={160}
                            bgColor="transparent"
                            fgColor="#C8A951"
                            level="M"
                          />
                        </div>

                        <div className="text-center mt-4">
                          <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>{t("ref")}</p>
                          <p style={{ fontSize: 16, color: "#C8A951", fontWeight: 600, marginTop: 4, fontFamily: "monospace" }}>{displayRef}</p>
                        </div>

                        <div className="text-center mt-4">
                          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{form.prenom} {form.nom}</p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{form.email}</p>
                        </div>

                        <div className="text-center mt-4">
                          <p style={{ fontSize: 10, color: "#C8A951", fontWeight: 600 }}>{event.nom}</p>
                        </div>

                        {event.logoUrl && (
                          <div className="mt-4">
                            <Image src={event.logoUrl} alt="" width={36} height={36} className="rounded-lg object-cover" />
                          </div>
                        )}

                        <div className="mt-4">
                          <p style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.25)" }}>
                            {t("scan_badge")}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setShowVerso(!showVerso)}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-gold rounded-full flex items-center justify-center shadow-lg hover:bg-gold2 transition"
                  title={showVerso ? "Voir recto" : "Voir verso"}
                >
                  <RotateCw className="w-4 h-4 text-ink" />
                </button>
                <p className="text-center mt-3 text-[11px] text-mute">{showVerso ? "Verso (dos)" : "Recto (face)"}</p>
              </div>
            )}

            {/* Ticket concert with places */}
            {isConcert && (
              <div className="w-[380px] bg-ink rounded-2xl overflow-hidden shadow-float" id="badge-print">
                <div className="bg-gold px-6 py-4 flex items-center justify-between">
                  {event.logoUrl && (
                    <Image src={event.logoUrl} alt="" width={28} height={28} className="rounded-md object-cover" />
                  )}
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#0A0A0A", letterSpacing: "0.04em" }}>AIKO</span>
                  <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#0A0A0A", fontWeight: 600 }}>{t("ticket")}</span>
                </div>

                <div className="px-6 pt-5 pb-3">
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#fff", lineHeight: 1.2 }}>{form.prenom} {form.nom}</p>
                </div>

                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 24px" }} />

                <div className="px-6 py-4">
                  <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>Evenement</p>
                  <p style={{ fontSize: 15, color: "#C8A951", fontWeight: 600, marginTop: 4 }}>{event.nom}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{formatDateRange(event.dateDebut, event.dateFin)}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{event.lieu} · {event.ville}</p>
                </div>

                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 24px" }} />

                <div className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>{t("ref")}</p>
                    <p style={{ fontSize: 14, color: "#C8A951", fontWeight: 600, marginTop: 2, fontFamily: "monospace" }}>{displayRef}</p>
                  </div>
                  {ticketNum > 0 && (
                    <div className="text-right">
                      <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>{t("ticket_no")}</p>
                      <p style={{ fontSize: 18, color: "#fff", fontWeight: 700, marginTop: 2, fontFamily: "monospace" }}>{String(ticketNum).padStart(4, "0")}</p>
                    </div>
                  )}
                </div>

                {!isFree && (
                  <>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 24px" }} />
                    <div className="px-6 py-2">
                      <div className="flex items-center justify-between">
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t("amount")}</p>
                        <p style={{ fontSize: 14, color: "#fff", fontWeight: 500 }}>{new Intl.NumberFormat("fr-FR").format(price)} XOF</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Places */}
                <div className="mx-6 my-2 rounded-lg px-4 py-2 flex items-center justify-between" style={{ background: "rgba(200,169,81,0.08)" }}>
                  <p style={{ fontSize: 10, color: "#C8A951", fontWeight: 600 }}>Places</p>
                  <p style={{ fontSize: 13, color: "#C8A951", fontWeight: 700 }}>
                    {event._count.participants} / {event.capacite}
                  </p>
                </div>

                <div className="px-6 py-5 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <QRCodeSVG
                    value={JSON.stringify({
                      ref: displayRef,
                      event: event.nom,
                      name: `${form.prenom} ${form.nom}`,
                      email: form.email,
                      type: "ticket",
                      ticket: ticketNum,
                    })}
                    size={150}
                    bgColor="transparent"
                    fgColor="#C8A951"
                    level="M"
                  />
                </div>

                <div className="px-6 pb-4 text-center">
                  <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)" }}>{t("scan_ticket")}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const el = document.getElementById("badge-print");
                  if (!el) return;
                  const w = window.open("", "_blank", "width=420,height=750");
                  if (!w) return;
                  w.document.write(`<!DOCTYPE html><html><head><title>${isConcert ? "Ticket" : "Badge"} AIKO — ${displayRef}</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh}@media print{body{margin:0;padding:0}}</style></head><body>${el.innerHTML}<script>window.onload=function(){window.print()}<\/script></body></html>`);
                  w.document.close();
                }}
                className="btn-press inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-6 py-3 text-[14px] font-semibold"
              >
                <Printer className="w-4 h-4" />
                {ts("print")}
              </button>
              <button
                onClick={() => {
                  const svgEl = document.querySelector("#badge-print svg") as SVGSVGElement | null;
                  if (!svgEl) return;
                  const canvas = document.createElement("canvas");
                  canvas.width = 300;
                  canvas.height = 300;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) return;
                  const svgData = new XMLSerializer().serializeToString(svgEl);
                  const img = new window.Image();
                  img.onload = () => {
                    ctx.fillStyle = "#0A0A0A";
                    ctx.fillRect(0, 0, 300, 300);
                    ctx.drawImage(img, 0, 0, 300, 300);
                    const qrDataUrl = canvas.toDataURL("image/png");
                    if (isConcert) {
                      const pdf = generateTicketPDF({
                        eventName: event.nom,
                        eventDate: formatDateRange(event.dateDebut, event.dateFin),
                        eventLieu: `${event.lieu} · ${event.ville}`,
                        participantName: `${form.prenom} ${form.nom}`,
                        email: form.email,
                        reference: displayRef,
                        ticketNumber: ticketNum || 1,
                        price,
                        qrDataUrl,
                        capacite: event.capacite,
                        totalSold: event._count.participants,
                      });
                      pdf.save(`ticket-${displayRef}.pdf`);
                    } else {
                      const pdf = generateSingleBadgePDF({
                        eventName: event.nom,
                        eventDate: formatDateRange(event.dateDebut, event.dateFin),
                        eventLieu: `${event.lieu} · ${event.ville}`,
                        eventType: event.type,
                        participant: {
                          name: `${form.prenom} ${form.nom}`,
                          organisation: form.organisation || undefined,
                          email: form.email,
                          reference: displayRef,
                          badgeNumber: ticketNum || 1,
                          qrDataUrl,
                        },
                      });
                      pdf.save(`badge-${displayRef}.pdf`);
                    }
                  };
                  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                }}
                className="btn-press inline-flex items-center gap-2 bg-ink hover:bg-ink2 text-cream rounded-full px-6 py-3 text-[14px] font-medium"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href={`/${locale}`} className="text-[14px] text-gold hover:text-gold2 font-medium">
              ← Retour
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-fade-up">
      <div className="max-w-5xl mx-auto px-5 lg:px-8 pt-10 pb-24">
        <Link href={`/${locale}`} className="text-[13px] text-mute hover:text-ink flex items-center gap-1.5 mb-8">
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </Link>

        <div className="bg-ink text-cream rounded-2xl overflow-hidden mb-8">
          {event.coverUrl && (
            <div className="relative h-48 sm:h-64">
              <Image src={event.coverUrl} alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
            </div>
          )}
          <div className={event.coverUrl ? "px-8 sm:px-10 pb-8 sm:pb-10 -mt-16 relative" : "p-8 sm:p-10"}>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-cream/40 mb-4">
            {event.logoUrl && (
              <Image src={event.logoUrl} alt="" width={32} height={32} className="rounded-lg object-cover" />
            )}
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span>{isConcert ? t("concert") : t("conference")}</span>
          </div>
          <h1 className="font-serif text-[32px] sm:text-[44px] text-cream leading-tight">
            {event.nom}
          </h1>
          <p className="text-cream/50 text-[15px] mt-4 max-w-xl">{event.description}</p>
          <div className="grid sm:grid-cols-3 gap-6 mt-8">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gold" />
              <div>
                <p className="text-[12px] text-cream/40">{t("date")}</p>
                <p className="text-[14px] text-cream font-medium">{formatDateRange(event.dateDebut, event.dateFin)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gold" />
              <div>
                <p className="text-[12px] text-cream/40">{t("venue")}</p>
                <p className="text-[14px] text-cream font-medium">{event.lieu} · {event.ville}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gold" />
              <div>
                <p className="text-[12px] text-cream/40">{t("participants")}</p>
                <p className="text-[14px] text-cream font-medium">{event._count.participants} {t("registered")}</p>
              </div>
            </div>
          </div>
          </div>
        </div>

        {event.latitude && event.longitude && (
          <div className="mb-8">
            <EventMap
              lat={event.latitude}
              lng={event.longitude}
              lieu={event.lieu}
              ville={event.ville}
            />
          </div>
        )}

        {(event.offreLogement || event.offreVehicule || event.offreExtras) && (
          <div className="flex flex-wrap gap-3 mb-8">
            {event.offreLogement && (
              <div className="inline-flex items-center gap-2 bg-gold/10 text-ink border border-gold/20 rounded-full px-4 py-2 text-[13px] font-medium">
                <Bed className="w-4 h-4 text-gold" />
                Logement inclus
              </div>
            )}
            {event.offreVehicule && (
              <div className="inline-flex items-center gap-2 bg-gold/10 text-ink border border-gold/20 rounded-full px-4 py-2 text-[13px] font-medium">
                <Car className="w-4 h-4 text-gold" />
                Transport disponible
              </div>
            )}
            {event.offreExtras && (
              <div className="inline-flex items-center gap-2 bg-gold/10 text-ink border border-gold/20 rounded-full px-4 py-2 text-[13px] font-medium">
                <Sparkles className="w-4 h-4 text-gold" />
                Extras & services
              </div>
            )}
          </div>
        )}

        {step === "info" && (
          <div className="text-center py-8">
            <button
              onClick={() => setStep("form")}
              className="btn-press inline-flex items-center gap-3 bg-gold hover:bg-gold2 text-ink rounded-full px-8 py-4 text-[16px] font-semibold"
            >
              {isConcert ? (
                <>
                  <Ticket className="w-5 h-5" />
                  {isFree ? t("get_ticket") : `${t("buy_ticket")} — ${new Intl.NumberFormat("fr-FR").format(price)} XOF`}
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  {isFree ? t("register_free") : `${t("register_paid")} — ${new Intl.NumberFormat("fr-FR").format(price)} XOF`}
                </>
              )}
            </button>
          </div>
        )}

        {step === "form" && (
          <div className="bg-white rounded-3xl border border-line shadow-card p-6 sm:p-10 animate-fade-up">
            <h2 className="font-serif text-[26px] text-ink mb-2">
              {isConcert ? t("form_title_ticket") : t("form_title_badge")}
            </h2>
            <p className="text-mute text-[14px] mb-8">
              {t("form_lead")} {isConcert ? t("ticket") : t("badge")}.
            </p>

            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">{t("first_name")}</label>
                <input required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} placeholder="Amadou" className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px]" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">{t("last_name")}</label>
                <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Diallo" className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px]" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">{t("email")}</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="amadou@exemple.com" className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px]" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">{t("phone")}</label>
                <input required value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+225 07 12 34 56 78" className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px] mono" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">{t("organization")}</label>
                <input value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} placeholder={t("optional")} className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px]" />
              </div>

              {hasLogement && (
                <div className="md:col-span-2 border-t border-line pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bed className="w-5 h-5 text-gold" />
                    <h3 className="text-[16px] font-serif text-ink">{t("lodging_title")}</h3>
                  </div>
                  <p className="text-[13px] text-mute mb-4">
                    {event!.residence!.nom} — {event!.residence!.adresse}, {event!.residence!.ville}
                    {event!.residence!.quartier && ` (${event!.residence!.quartier})`}
                  </p>
                  {event!.residence!.images.length > 0 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {event!.residence!.images.map((img, i) => (
                        <Image key={i} src={img.url} alt={img.legende || ""} width={112} height={80} className="rounded-lg object-cover flex-shrink-0" />
                      ))}
                    </div>
                  )}
                  {event!.residence!.equipements && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {event!.residence!.equipements.split(",").map((eq, i) => (
                        <span key={i} className="text-[11px] bg-cream2 text-mute px-2.5 py-1 rounded-full">{eq.trim()}</span>
                      ))}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTarifId(null)}
                      className={`text-left rounded-xl border p-4 transition-all ${
                        !selectedTarifId ? "border-gold bg-gold/5 ring-1 ring-gold" : "border-line hover:border-mute"
                      }`}
                    >
                      <p className="text-[14px] text-ink font-medium">{t("no_lodging")}</p>
                      <p className="text-[12px] text-mute mt-1">{t("no_lodging_desc")}</p>
                    </button>
                    {event!.residence!.tarifs.map((tarif) => (
                      <button
                        key={tarif.id}
                        type="button"
                        onClick={() => setSelectedTarifId(tarif.id)}
                        className={`text-left rounded-xl border p-4 transition-all ${
                          selectedTarifId === tarif.id ? "border-gold bg-gold/5 ring-1 ring-gold" : "border-line hover:border-mute"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[14px] text-ink font-medium">{tarif.label}</p>
                          <Star className="w-4 h-4 text-gold" />
                        </div>
                        <p className="text-[12px] text-mute mt-1">{tarif.typeChambre} · {tarif.capacite} {t("max_persons")}</p>
                        <p className="text-[15px] text-gold font-semibold mt-2">
                          {new Intl.NumberFormat("fr-FR").format(tarif.prixParNuit)} {tarif.devise}<span className="text-[11px] text-mute font-normal"> {t("per_night")}</span>
                        </p>
                      </button>
                    ))}
                  </div>
                  {selectedTarif && (
                    <div className="mt-3 bg-gold/10 border border-gold/20 rounded-xl px-4 py-3 text-[13px] text-ink">
                      <Bed className="w-4 h-4 text-gold inline mr-1.5" />
                      {t("room_booked")} : <strong>{selectedTarif.label}</strong> — {new Intl.NumberFormat("fr-FR").format(selectedTarif.prixParNuit)} {selectedTarif.devise}{t("per_night")}
                    </div>
                  )}
                </div>
              )}

              <div className="md:col-span-2 border-t border-line pt-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.useForBadge} onChange={(e) => setForm({ ...form, useForBadge: e.target.checked })} className="accent-gold w-5 h-5 mt-0.5" />
                  <div>
                    <p className="text-[14px] text-ink font-medium">
                      {t("use_for_badge")} {isConcert ? t("ticket") : t("badge")}
                    </p>
                    <p className="text-[12px] text-mute mt-1">
                      {t("badge_info")} {isConcert ? t("ticket") : t("badge")} {t("with_qr")}
                    </p>
                  </div>
                </label>
              </div>

              {!isFree && (
                <div className="md:col-span-2 bg-cream2 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] text-ink font-medium">
                        {isConcert ? t("ticket") : t("badge")} — {event.nom}
                      </p>
                      <p className="text-[12px] text-mute mt-1">
                        {isConcert ? t("commission") : t("fee")}
                      </p>
                    </div>
                    <p className="font-serif text-[28px] text-ink">{new Intl.NumberFormat("fr-FR").format(price)} <span className="text-[14px] text-mute">XOF</span></p>
                  </div>
                </div>
              )}

              {payError && (
                <div className="md:col-span-2 bg-err/10 border border-err/20 text-err rounded-xl px-4 py-3 text-[13px]">
                  {payError}
                </div>
              )}

              <div className="md:col-span-2 flex justify-end pt-2">
                {isFree ? (
                  <button type="submit" className="btn-press inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-8 py-4 text-[15px] font-semibold">
                    {t("free_btn")} {isConcert ? t("ticket") : t("badge")}
                  </button>
                ) : (
                  <PaymentButton
                    amount={price}
                    description={`${isConcert ? t("ticket") : t("badge")} — ${event.nom}`}
                    customerName={`${form.prenom} ${form.nom}`}
                    customerEmail={form.email}
                    customerPhone={form.telephone}
                    eventSlug={event.slug}
                    type={isConcert ? "ticket" : "badge"}
                    onBeforePay={saveParticipantBeforePay}
                    onError={setPayError}
                    disabled={!form.prenom || !form.nom || !form.email}
                    label={`Payer ${new Intl.NumberFormat("fr-FR").format(price)} XOF`}
                  />
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
