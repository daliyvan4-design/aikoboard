"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import { Printer } from "lucide-react";

interface BookingBadgeProps {
  reference: string;
  prenom: string;
  nom: string;
  nationalite: string;
  dateArrivee: string;
  dateDepart: string;
  nombrePersonnes: number;
  typeReservation: "NORMALE" | "INSTITUTIONNELLE";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BookingBadge({
  reference,
  prenom,
  nom,
  nationalite,
  dateArrivee,
  dateDepart,
  nombrePersonnes,
  typeReservation,
}: BookingBadgeProps) {
  const badgeRef = useRef<HTMLDivElement>(null);

  const qrData = JSON.stringify({
    ref: reference,
    name: `${prenom} ${nom}`,
    arrival: dateArrivee,
    departure: dateDepart,
    pax: nombrePersonnes,
    type: typeReservation,
  });

  function handlePrint() {
    const badge = badgeRef.current;
    if (!badge) return;

    const printWindow = window.open("", "_blank", "width=420,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Badge AIKO Board — ${reference}</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          @media print {
            body { margin: 0; padding: 0; }
            .badge { box-shadow: none !important; }
          }
        </style>
      </head>
      <body>
        ${badge.innerHTML}
        <script>
          window.onload = function() { window.print(); window.close(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={badgeRef}
        className="badge w-[360px] bg-ink rounded-2xl overflow-hidden shadow-float"
      >
        <div className="bg-gold px-6 py-4 flex items-center justify-between">
          <span
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#0A0A0A", letterSpacing: "0.04em" }}
          >
            AIKO
          </span>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#0A0A0A", fontWeight: 600 }}>
            {typeReservation === "INSTITUTIONNELLE" ? "VIP" : "Badge"}
          </span>
        </div>

        <div className="px-6 pt-6 pb-4">
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fff", lineHeight: 1.2 }}>
            {prenom} {nom}
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
            {nationalite}
          </p>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 24px" }} />

        <div className="px-6 py-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>Arrivée</p>
            <p style={{ fontSize: 14, color: "#fff", fontWeight: 500, marginTop: 2 }}>{formatDate(dateArrivee)}</p>
          </div>
          <div>
            <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>Départ</p>
            <p style={{ fontSize: 14, color: "#fff", fontWeight: 500, marginTop: 2 }}>{formatDate(dateDepart)}</p>
          </div>
          <div>
            <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>Passagers</p>
            <p style={{ fontSize: 14, color: "#fff", fontWeight: 500, marginTop: 2 }}>{nombrePersonnes}</p>
          </div>
          <div>
            <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>Reference</p>
            <p style={{ fontSize: 14, color: "#C8A951", fontWeight: 600, marginTop: 2, fontFamily: "monospace" }}>{reference}</p>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 24px" }} />

        <div className="px-6 py-5 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)" }}>
          <QRCodeSVG
            value={qrData}
            size={140}
            bgColor="transparent"
            fgColor="#C8A951"
            level="M"
          />
        </div>

        <div className="px-6 pb-4 text-center">
          <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)" }}>
            Scannez pour vérifier · Salon 2026 · Abidjan
          </p>
        </div>
      </div>

      <button
        onClick={handlePrint}
        className="btn-press inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-6 py-3 text-[14px] font-semibold"
      >
        <Printer className="w-4 h-4" />
        Imprimer mon badge
      </button>
    </div>
  );
}
