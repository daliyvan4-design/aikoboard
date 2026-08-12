"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Search,
  Loader2,
  Download,
  XCircle,
} from "lucide-react";

interface ParticipantData {
  reference: string;
  ticketNumber: number;
  prenom: string;
  nom: string;
  email: string;
  organisation: string | null;
  type: string;
  statut: string;
  event: {
    nom: string;
    slug: string;
    type: string;
    lieu: string;
    ville: string;
    dateDebut: string;
    dateFin: string;
  };
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  return `${s.toLocaleDateString("fr-FR", { day: "numeric" })} - ${e.toLocaleDateString("fr-FR", opts)}`;
}

export default function MonQRPage() {
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [participant, setParticipant] = useState<ParticipantData | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setParticipant(null);

    try {
      const res = await fetch(`/api/participants/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.success) {
        setParticipant(data.data);
      } else {
        setError("Reference introuvable. Vérifiez votre numéro.");
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    }

    setLoading(false);
  };

  const handleDownload = async () => {
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

  return (
    <section className="animate-fade-up">
      <div className="max-w-lg mx-auto px-5 pt-10 pb-24">
        <Link href={`/${locale}`} className="text-[13px] text-mute hover:text-ink flex items-center gap-1.5 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <div className="text-center mb-10">
          <h1 className="font-serif text-[32px] text-ink">Mon QR Code</h1>
          <p className="text-mute mt-2 text-[15px]">
            Entrez votre numéro de reference pour retrouver votre QR code d&apos;accès.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-mute absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="AIKO-XXXXXX"
              className="w-full bg-cream2 border border-line rounded-xl pl-11 pr-4 py-3.5 text-[15px] font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-press bg-gold hover:bg-gold2 text-ink rounded-xl px-6 py-3.5 text-[14px] font-semibold disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Rechercher"}
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-3 bg-err/10 border border-err/20 rounded-xl px-5 py-4 mb-6">
            <XCircle className="w-5 h-5 text-err flex-shrink-0" />
            <p className="text-[14px] text-err">{error}</p>
          </div>
        )}

        {participant && (
          <div className="flex flex-col items-center gap-6 animate-fade-up">
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
                  value={JSON.stringify({
                    ref: participant.reference,
                    event: participant.event.nom,
                    name: `${participant.prenom} ${participant.nom}`,
                    type: participant.type,
                    ticket: participant.ticketNumber,
                  })}
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

            <button
              onClick={handleDownload}
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
          </div>
        )}
      </div>
    </section>
  );
}
