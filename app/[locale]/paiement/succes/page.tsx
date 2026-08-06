"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  Printer,
  Download,
  FileText,
} from "lucide-react";
import { Suspense } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateTicketPDF } from "@/lib/generate-ticket-pdf";
import { generateReceiptPDF } from "@/lib/generate-receipt-pdf";

interface ParticipantData {
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
  event: {
    slug: string;
    nom: string;
    type: string;
    lieu: string;
    ville: string;
    dateDebut: string;
    dateFin: string;
    organisateur: string;
    prixBadge: number;
    prixTicket: number;
  };
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  return `${s.toLocaleDateString("fr-FR", { day: "numeric" })} — ${e.toLocaleDateString("fr-FR", opts)}`;
}

function SuccessContent() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const payRef = searchParams.get("ref") ?? "";
  const participantRef = searchParams.get("p") ?? "";
  const eventSlug = searchParams.get("event") ?? "";
  const type = searchParams.get("type") ?? "";

  const [participant, setParticipant] = useState<ParticipantData | null>(null);
  const [loading, setLoading] = useState(!!participantRef);
  const [pollCount, setPollCount] = useState(0);

  const fetchParticipant = useCallback(async () => {
    if (!participantRef) return;
    try {
      const res = await fetch(`/api/participants/${participantRef}`);
      const data = await res.json();
      if (data.success) {
        setParticipant(data.data);
        setLoading(false);
      }
    } catch {
      // keep polling
    }
  }, [participantRef]);

  useEffect(() => {
    if (!participantRef) {
      setLoading(false);
      return;
    }
    fetchParticipant();
  }, [participantRef, fetchParticipant]);

  useEffect(() => {
    if (!participantRef || participant || pollCount >= 10) return;
    const timer = setTimeout(() => {
      fetchParticipant();
      setPollCount((c) => c + 1);
    }, 3000);
    return () => clearTimeout(timer);
  }, [participantRef, participant, pollCount, fetchParticipant]);

  if (loading && !participant) {
    return (
      <section className="animate-fade-up">
        <div className="max-w-xl mx-auto px-5 py-32 text-center">
          <Loader2 className="w-12 h-12 text-gold mx-auto mb-6 animate-spin" />
          <h1 className="font-serif text-[32px] text-ink mb-4">
            Paiement en cours de confirmation...
          </h1>
          <p className="text-mute text-[15px]">
            Votre badge sera disponible dans quelques instants.
          </p>
        </div>
      </section>
    );
  }

  if (participant) {
    const isConcert = participant.event.type === "concert";
    const price = participant.montant;

    return (
      <section className="animate-fade-up">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 pt-10 pb-24">
          <div className="text-center mb-12">
            <CheckCircle2 className="w-16 h-16 text-ok mx-auto mb-5" />
            <h2 className="font-serif text-[36px] sm:text-[44px] text-ink">
              {isConcert ? "Ticket confirme" : "Accreditation confirmee"}
            </h2>
            <p className="text-mute mt-3 text-[16px] max-w-lg mx-auto">
              {participant.prenom}, votre {isConcert ? "ticket" : "badge"} pour <strong>{participant.event.nom}</strong> est pret.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="w-[380px] bg-ink rounded-2xl overflow-hidden shadow-float" id="badge-print">
              <div className="bg-gold px-6 py-4 flex items-center justify-between">
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#0A0A0A", letterSpacing: "0.04em" }}>
                  AIKO
                </span>
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#0A0A0A", fontWeight: 600 }}>
                  {isConcert ? "Ticket" : "Badge"}
                </span>
              </div>

              <div className="px-6 pt-5 pb-3">
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#fff", lineHeight: 1.2 }}>
                  {participant.prenom} {participant.nom}
                </p>
                {participant.organisation && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{participant.organisation}</p>
                )}
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 24px" }} />

              <div className="px-6 py-4">
                <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>Evenement</p>
                <p style={{ fontSize: 15, color: "#C8A951", fontWeight: 600, marginTop: 4 }}>{participant.event.nom}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                  {formatDateRange(participant.event.dateDebut, participant.event.dateFin)}
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                  {participant.event.lieu} · {participant.event.ville}
                </p>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 24px" }} />

              <div className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>Reference</p>
                  <p style={{ fontSize: 14, color: "#C8A951", fontWeight: 600, marginTop: 2, fontFamily: "monospace" }}>{participant.reference}</p>
                </div>
                <div className="text-right">
                  <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>
                    {isConcert ? "Ticket N°" : "N°"}
                  </p>
                  <p style={{ fontSize: isConcert ? 18 : 14, color: "#fff", fontWeight: isConcert ? 700 : 500, marginTop: 2, fontFamily: "monospace" }}>
                    {String(participant.ticketNumber).padStart(4, "0")}
                  </p>
                </div>
              </div>

              {price > 0 && (
                <>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 24px" }} />
                  <div className="px-6 py-2">
                    <div className="flex items-center justify-between">
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Montant</p>
                      <p style={{ fontSize: 14, color: "#fff", fontWeight: 500 }}>
                        {new Intl.NumberFormat("fr-FR").format(price)} XOF
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="px-6 py-5 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                <QRCodeSVG
                  value={JSON.stringify({
                    ref: participant.reference,
                    event: participant.event.nom,
                    name: `${participant.prenom} ${participant.nom}`,
                    email: participant.email,
                    type: isConcert ? "ticket" : "badge",
                    ticket: participant.ticketNumber,
                  })}
                  size={150}
                  bgColor="transparent"
                  fgColor="#C8A951"
                  level="M"
                />
              </div>

              <div className="px-6 pb-4 text-center">
                <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)" }}>
                  Scannez avec AIKO · {isConcert ? "Ticket numerique" : "Accreditation"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const el = document.getElementById("badge-print");
                  if (!el) return;
                  const w = window.open("", "_blank", "width=420,height=750");
                  if (!w) return;
                  w.document.write(`<!DOCTYPE html><html><head><title>${isConcert ? "Ticket" : "Badge"} AIKO — ${participant.reference}</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh}@media print{body{margin:0;padding:0}}</style></head><body>${el.innerHTML}<script>window.onload=function(){window.print()}<\/script></body></html>`);
                  w.document.close();
                }}
                className="btn-press inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-6 py-3 text-[14px] font-semibold"
              >
                <Printer className="w-4 h-4" />
                Imprimer
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
                  const img = new Image();
                  img.onload = () => {
                    ctx.fillStyle = "#0A0A0A";
                    ctx.fillRect(0, 0, 300, 300);
                    ctx.drawImage(img, 0, 0, 300, 300);
                    const qrDataUrl = canvas.toDataURL("image/png");
                    const pdf = generateTicketPDF({
                      eventName: participant.event.nom,
                      eventDate: formatDateRange(participant.event.dateDebut, participant.event.dateFin),
                      eventLieu: `${participant.event.lieu} · ${participant.event.ville}`,
                      participantName: `${participant.prenom} ${participant.nom}`,
                      email: participant.email,
                      reference: participant.reference,
                      ticketNumber: participant.ticketNumber,
                      price,
                      qrDataUrl,
                    });
                    pdf.save(`${isConcert ? "ticket" : "badge"}-${participant.reference}.pdf`);
                  };
                  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                }}
                className="btn-press inline-flex items-center gap-2 bg-ink hover:bg-ink2 text-cream rounded-full px-6 py-3 text-[14px] font-medium"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => {
                  const receipt = generateReceiptPDF({
                    reference: participant.reference,
                    date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
                    customerName: `${participant.prenom} ${participant.nom}`,
                    customerEmail: participant.email,
                    eventName: participant.event.nom,
                    eventDate: formatDateRange(participant.event.dateDebut, participant.event.dateFin),
                    eventLieu: `${participant.event.lieu} · ${participant.event.ville}`,
                    items: [
                      {
                        label: `${isConcert ? "Ticket" : "Badge"} — ${participant.event.nom}`,
                        amount: price,
                      },
                    ],
                    total: price,
                    currency: "XOF",
                    paymentMethod: "GeniusPay",
                  });
                  receipt.save(`recu-${participant.reference}.pdf`);
                }}
                className="btn-press inline-flex items-center gap-2 border border-line text-ink rounded-full px-6 py-3 text-[14px] font-medium hover:bg-cream2"
              >
                <FileText className="w-4 h-4" />
                Recu
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
      <div className="max-w-xl mx-auto px-5 py-32 text-center">
        <CheckCircle2 className="w-20 h-20 text-ok mx-auto mb-6" />
        <h1 className="font-serif text-[40px] text-ink mb-4">
          Paiement confirme
        </h1>
        <p className="text-mute text-[16px] mb-2">
          Votre paiement a ete traite avec succes via GeniusPay.
        </p>
        {payRef && (
          <p className="text-[14px] text-mute mb-8">
            Reference : <span className="font-mono text-gold font-semibold">{payRef}</span>
          </p>
        )}

        {eventSlug && type === "event_creation" && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href={`/${locale}/organisateur/${eventSlug}`}
              className="btn-press inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-8 py-4 text-[15px] font-semibold"
            >
              Mon dashboard organisateur
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {type === "reservation" && (
          <div className="space-y-4 mb-8">
            <p className="text-[15px] text-ink font-medium">
              Votre reservation est confirmee. Notre equipe vous contactera sous 24h.
            </p>
            <Link
              href={`/${locale}`}
              className="btn-press inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-8 py-4 text-[15px] font-semibold"
            >
              Retour a l&apos;accueil
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {!eventSlug && type !== "reservation" && (
          <Link
            href={`/${locale}`}
            className="btn-press inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-8 py-4 text-[15px] font-semibold"
          >
            Retour
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </section>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
