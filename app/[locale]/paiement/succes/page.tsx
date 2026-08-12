"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  Download,
  FileText,
} from "lucide-react";
import { Suspense } from "react";
import { QRCodeSVG } from "qrcode.react";
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
  return `${s.toLocaleDateString("fr-FR", { day: "numeric" })} - ${e.toLocaleDateString("fr-FR", opts)}`;
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
  const [downloading, setDownloading] = useState(false);
  const [eventActivated, setEventActivated] = useState<boolean | null>(null);

  // Creation d'evenement : on demande au serveur de verifier le paiement
  // aupres de GeniusPay et d'activer l'evenement — filet si le webhook
  // n'est pas arrive.
  useEffect(() => {
    if (!payRef || type !== "event_creation") return;
    fetch(`/api/payments/${encodeURIComponent(payRef)}`)
      .then((r) => r.json())
      .then((d) => setEventActivated(d.status === "completed"))
      .catch(() => setEventActivated(false));
  }, [payRef, type]);

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
    // `loading` demarre deja a false quand il n'y a pas de reference
    // (useState(!!participantRef)) : rien a remettre a zero ici.
    // Les setState de fetchParticipant surviennent apres l'await du fetch,
    // jamais pendant le rendu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (participantRef) fetchParticipant();
  }, [participantRef, fetchParticipant]);

  useEffect(() => {
    if (!participantRef || participant || pollCount >= 10) return;
    const timer = setTimeout(() => {
      fetchParticipant();
      setPollCount((c) => c + 1);
    }, 3000);
    return () => clearTimeout(timer);
  }, [participantRef, participant, pollCount, fetchParticipant]);

  const handleDownloadQR = async () => {
    if (!participant) return;
    setDownloading(true);

    try {
      const QRCode = (await import("qrcode")).default;
      const { jsPDF } = await import("jspdf");

      const qrValue = JSON.stringify({
        ref: participant.reference,
        event: participant.event.nom,
        name: `${participant.prenom} ${participant.nom}`,
        type: participant.type,
        ticket: participant.ticketNumber,
      });

      const qrDataUrl = await QRCode.toDataURL(qrValue, {
        width: 800,
        margin: 2,
        color: { dark: "#0A0A0A", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      });

      const doc = new jsPDF({ unit: "mm", format: [100, 140] });

      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, 100, 140, "F");

      doc.setFillColor(200, 169, 81);
      doc.rect(0, 0, 100, 12, "F");
      doc.setTextColor(10, 10, 10);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("AIKO BOARD", 50, 8, { align: "center" });

      doc.setTextColor(200, 169, 81);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      const evLines = doc.splitTextToSize(participant.event.nom, 80);
      doc.text(evLines.slice(0, 2), 50, 20, { align: "center" });

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${formatDateRange(participant.event.dateDebut, participant.event.dateFin)} · ${participant.event.lieu}`,
        50, 28, { align: "center" }
      );

      const qrSize = 55;
      doc.addImage(qrDataUrl, "PNG", (100 - qrSize) / 2, 34, qrSize, qrSize);

      doc.setTextColor(200, 169, 81);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text("REFERENCE", 50, 96, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(participant.reference, 50, 103, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`${participant.prenom} ${participant.nom}`, 50, 112, { align: "center" });

      if (participant.organisation) {
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text(participant.organisation, 50, 118, { align: "center" });
      }

      doc.setTextColor(80, 80, 80);
      doc.setFontSize(4.5);
      doc.text("Presentez ce QR code a l'entree de l'evenement", 50, 132, { align: "center" });

      doc.save(`qr-${participant.reference}.pdf`);
    } catch (err) {
      console.error("QR PDF error:", err);
    }

    setDownloading(false);
  };

  if (loading && !participant) {
    return (
      <section className="animate-fade-up">
        <div className="max-w-xl mx-auto px-5 py-32 text-center">
          <Loader2 className="w-12 h-12 text-gold mx-auto mb-6 animate-spin" />
          <h1 className="font-serif text-[32px] text-ink mb-4">
            Paiement en cours de confirmation...
          </h1>
          <p className="text-mute text-[15px]">
            Votre QR code sera disponible dans quelques instants.
          </p>
        </div>
      </section>
    );
  }

  if (participant) {
    const isConcert = participant.event.type === "concert";
    const price = participant.montant;

    const qrValue = JSON.stringify({
      ref: participant.reference,
      event: participant.event.nom,
      name: `${participant.prenom} ${participant.nom}`,
      type: participant.type,
      ticket: participant.ticketNumber,
    });

    return (
      <section className="animate-fade-up">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 pt-10 pb-24">
          <div className="text-center mb-12">
            <CheckCircle2 className="w-16 h-16 text-ok mx-auto mb-5" />
            <h2 className="font-serif text-[36px] sm:text-[44px] text-ink">
              {isConcert ? "Ticket confirme" : "Inscription confirmee"}
            </h2>
            <p className="text-mute mt-3 text-[16px] max-w-lg mx-auto">
              {participant.prenom}, votre QR code d&apos;accès pour <strong>{participant.event.nom}</strong> est prêt.
              Présentez-le à l&apos;entrée le jour de l&apos;événement.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            {/* QR Code card */}
            <div className="w-full max-w-[340px] bg-ink rounded-2xl overflow-hidden shadow-float">
              <div className="bg-gold px-6 py-3 flex items-center justify-center">
                <span className="font-serif text-[18px] font-bold text-ink tracking-wide">AIKO BOARD</span>
              </div>

              <div className="px-6 pt-5 text-center">
                <p className="text-[13px] text-gold font-semibold">{participant.event.nom}</p>
                <p className="text-[11px] text-cream/40 mt-1">
                  {formatDateRange(participant.event.dateDebut, participant.event.dateFin)} · {participant.event.lieu}
                </p>
              </div>

              <div className="flex items-center justify-center py-6">
                <QRCodeSVG
                  value={qrValue}
                  size={180}
                  bgColor="transparent"
                  fgColor="#C8A951"
                  level="M"
                />
              </div>

              <div className="text-center pb-2">
                <p className="text-[10px] text-cream/40 uppercase tracking-widest">Reference</p>
                <p className="text-[22px] text-cream font-bold font-mono mt-1">{participant.reference}</p>
              </div>

              <div className="text-center pb-5">
                <p className="text-[14px] text-cream font-semibold">{participant.prenom} {participant.nom}</p>
                {participant.organisation && (
                  <p className="text-[11px] text-cream/40 mt-1">{participant.organisation}</p>
                )}
              </div>

              <div className="text-center pb-4">
                <p className="text-[8px] text-cream/20 uppercase tracking-[0.3em]">Présentez ce QR code à l&apos;entrée</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadQR}
                disabled={downloading}
                className="btn-press inline-flex items-center gap-2.5 bg-gold hover:bg-gold2 text-ink rounded-full px-8 py-4 text-[15px] font-semibold disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {downloading ? "Generation..." : "Télécharger mon QR code (PDF)"}
              </button>

              {price > 0 && (
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
                          label: `${isConcert ? "Ticket" : "Inscription"} — ${participant.event.nom}`,
                          amount: price,
                        },
                      ],
                      total: price,
                      currency: "XOF",
                      paymentMethod: "GeniusPay",
                    });
                    receipt.save(`recu-${participant.reference}.pdf`);
                  }}
                  className="btn-press inline-flex items-center gap-2 border border-line text-ink rounded-full px-6 py-4 text-[14px] font-medium hover:bg-cream2"
                >
                  <FileText className="w-4 h-4" />
                  Télécharger le recu
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 text-center space-y-3">
            <p className="text-[12px] text-mute">
              Perdu votre QR code ?{" "}
              <Link href={`/${locale}/mon-qr`} className="text-gold hover:text-gold2 font-medium underline underline-offset-2">
                Retrouvez-le ici
              </Link>
            </p>
            <Link href={`/${locale}`} className="text-[14px] text-gold hover:text-gold2 font-medium block">
              ← Retour à l&apos;accueil
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
          <div className="mb-8">
            <p className="text-[14px] text-mute mb-5 max-w-md mx-auto leading-relaxed">
              {eventActivated === false
                ? "Activation en cours. Votre lien privé de gestion vous est envoyé par email des confirmation du paiement."
                : "Votre événement est actif. Le lien privé de votre tableau de bord vient de vous etre envoyé par email — conservez-le."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/${locale}/organisateur/${eventSlug}`}
                className="btn-press inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-8 py-4 text-[15px] font-semibold"
              >
                Mon dashboard organisateur
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
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
              Retour à l&apos;accueil
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
