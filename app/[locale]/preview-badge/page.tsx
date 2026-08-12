"use client";

import { QRCodeSVG } from "qrcode.react";
import { notFound } from "next/navigation";

const NAVY = "#0A1628";
const GOLD = "#C8A951";
const SILVER = "#A0A5AF";
const DARK_LINE = "#1E2D41";

function BadgeRecto() {
  return (
    <div
      className="rounded-lg overflow-hidden shadow-float flex flex-col relative"
      style={{ width: 280, height: 176, background: NAVY }}
    >
      {/* Gold top accent */}
      <div style={{ height: 4, background: GOLD }} />

      {/* Header: event name + badge type */}
      <div className="px-3 pt-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="rounded-sm flex items-center justify-center"
            style={{ width: 18, height: 18, background: DARK_LINE, border: `1px solid ${GOLD}40` }}
          >
            <span style={{ fontSize: 6, color: GOLD, fontWeight: 700 }}>A</span>
          </div>
          <div>
            <p style={{ fontSize: 8, color: "#fff", fontWeight: 700, lineHeight: 1.2 }}>
              23rd Annual AVCA Conference
            </p>
            <p style={{ fontSize: 6, color: SILVER, lineHeight: 1.2 }}>& VC Summit</p>
          </div>
        </div>
        <div
          className="rounded-sm px-2 py-0.5"
          style={{ background: GOLD }}
        >
          <span style={{ fontSize: 7, fontWeight: 700, color: NAVY, letterSpacing: "0.08em" }}>DELEGATE</span>
        </div>
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: DARK_LINE, margin: "6px 12px" }} />

      {/* Photo + Name block */}
      <div className="px-3 flex gap-3 flex-1">
        {/* Photo frame */}
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 52,
            height: 52,
            border: `1.5px solid ${GOLD}`,
            background: DARK_LINE,
          }}
        >
          <span style={{ fontSize: 7, color: SILVER }}>PHOTO</span>
        </div>

        {/* Name + title + org */}
        <div className="flex flex-col justify-center min-w-0">
          <p style={{ fontSize: 14, color: "#fff", fontWeight: 700, lineHeight: 1.2 }}>
            Amadou Diallo
          </p>
          <p style={{ fontSize: 7, color: GOLD, fontWeight: 700, marginTop: 2, letterSpacing: "0.05em" }}>
            MANAGING DIRECTOR
          </p>
          <p style={{ fontSize: 8, color: SILVER, marginTop: 1 }}>
            AIKO Group International
          </p>
        </div>
      </div>

      {/* Bottom section */}
      <div style={{ borderTop: `1px solid ${DARK_LINE}`, margin: "0" }}>
        <div className="px-3 py-1.5 flex items-center justify-between">
          <div>
            <p style={{ fontSize: 6.5, color: SILVER }}>&#9675; Sofitel Hotel Ivoire &middot; Abidjan</p>
            <p style={{ fontSize: 6.5, color: SILVER }}>&#9675; 11 &mdash; 17 mars 2026</p>
          </div>
          <div className="flex items-center gap-1">
            <span style={{ fontSize: 6, color: GOLD, fontWeight: 700 }}>N&deg;</span>
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 700, fontFamily: "monospace" }}>0042</span>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div className="text-center" style={{ paddingBottom: 3 }}>
        <p style={{ fontSize: 5, color: "#324150", letterSpacing: "0.12em" }}>POWERED BY AIKO BOARD</p>
      </div>
    </div>
  );
}

function BadgeVerso() {
  return (
    <div
      className="rounded-lg overflow-hidden shadow-float flex flex-col items-center relative"
      style={{ width: 280, height: 176, background: NAVY }}
    >
      {/* QR Code */}
      <div className="flex-1 flex items-center justify-center pt-3">
        <div className="p-1.5" style={{ background: "#fff", borderRadius: 2 }}>
          <QRCodeSVG
            value={JSON.stringify({ ref: "AIKO-X7K2M9", event: "23rd Annual AVCA Conference", name: "Amadou Diallo", type: "badge", ticket: 42 })}
            size={72}
            bgColor="#ffffff"
            fgColor="#0A1628"
            level="M"
          />
        </div>
      </div>

      {/* Reference */}
      <div className="text-center">
        <p style={{ fontSize: 6, textTransform: "uppercase", letterSpacing: "0.2em", color: GOLD, fontWeight: 700 }}>Reference</p>
        <p style={{ fontSize: 11, color: "#fff", fontWeight: 700, marginTop: 2, fontFamily: "monospace" }}>AIKO-X7K2M9</p>
      </div>

      {/* Name */}
      <div className="text-center py-2">
        <p style={{ fontSize: 8, color: SILVER }}>Amadou Diallo</p>
      </div>

      {/* Separator */}
      <div style={{ width: 80, height: 1, background: DARK_LINE }} />

      {/* Non-transferable */}
      <div className="text-center py-1.5">
        <p style={{ fontSize: 5.5, color: "#465569", letterSpacing: "0.04em" }}>CE BADGE EST PERSONNEL ET NON TRANSFERABLE</p>
      </div>

      {/* Scan instruction */}
      <div className="text-center pb-2">
        <p style={{ fontSize: 5.5, color: GOLD, letterSpacing: "0.1em" }}>SCANNEZ AVEC AIKO BOARD</p>
      </div>

      {/* Gold bottom accent */}
      <div style={{ height: 4, background: GOLD, width: "100%" }} />
    </div>
  );
}

function TicketConcert() {
  return (
    <div className="rounded-lg overflow-hidden shadow-float" style={{ width: 280, background: NAVY }}>
      <div style={{ height: 4, background: GOLD }} />
      <div className="px-4 pt-3 flex items-center justify-between">
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Marie Kouassi</span>
        <div className="rounded-sm px-2 py-0.5" style={{ background: GOLD }}>
          <span style={{ fontSize: 7, fontWeight: 700, color: NAVY }}>TICKET</span>
        </div>
      </div>
      <div style={{ height: 1, background: DARK_LINE, margin: "8px 16px" }} />
      <div className="px-4 pb-2">
        <p style={{ fontSize: 10, color: GOLD, fontWeight: 600 }}>Afro Music Festival</p>
        <p style={{ fontSize: 8, color: SILVER, marginTop: 2 }}>22 &mdash; 24 avril 2026 &middot; Palais de la Culture</p>
      </div>
      <div style={{ height: 1, background: DARK_LINE, margin: "0 16px" }} />
      <div className="px-4 py-2 flex items-center justify-between">
        <div>
          <p style={{ fontSize: 6, color: SILVER, textTransform: "uppercase", letterSpacing: "0.15em" }}>Reference</p>
          <p style={{ fontSize: 10, color: GOLD, fontWeight: 600, fontFamily: "monospace", marginTop: 1 }}>AIKO-R3P8W1</p>
        </div>
        <div className="text-right">
          <p style={{ fontSize: 6, color: SILVER, textTransform: "uppercase", letterSpacing: "0.15em" }}>Ticket N&deg;</p>
          <p style={{ fontSize: 16, color: "#fff", fontWeight: 700, fontFamily: "monospace" }}>0187</p>
        </div>
      </div>
      <div className="px-4 py-3 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="p-1.5" style={{ background: "#fff", borderRadius: 2 }}>
          <QRCodeSVG value={JSON.stringify({ ref: "AIKO-R3P8W1", event: "Afro Music Festival", name: "Marie Kouassi", type: "ticket", ticket: 187 })} size={100} bgColor="#ffffff" fgColor="#0A1628" level="M" />
        </div>
      </div>
      <div className="text-center pb-3">
        <p style={{ fontSize: 6, color: GOLD, letterSpacing: "0.15em" }}>SCANNEZ AVEC AIKO BOARD</p>
      </div>
      <div style={{ height: 4, background: GOLD }} />
    </div>
  );
}

export default function PreviewBadge() {
  // Page de reference design, utile en developpement seulement : en
  // production elle repond 404 plutot que d'exposer une page de test.
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-screen bg-cream2 p-10">
      <h1 className="text-2xl font-bold text-ink mb-2">Badge & Ticket Preview — AVCA Style</h1>
      <p className="text-sm text-mute mb-8">Design inspire du specimen AVCA VIP — Navy + Gold, cadre photo, titre/fonction</p>

      <div className="mb-12">
        <p className="text-[11px] uppercase tracking-wider text-mute mb-4">Badge Conference — Recto / Verso (CR80 85.6x54mm)</p>
        <div className="flex items-start gap-8 flex-wrap">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-center text-mute mb-2">Recto (face)</p>
            <BadgeRecto />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-center text-mute mb-2">Verso (dos)</p>
            <BadgeVerso />
          </div>
        </div>
      </div>

      <div className="mb-12">
        <p className="text-[11px] uppercase tracking-wider text-mute mb-4">Ticket Concert</p>
        <TicketConcert />
      </div>
    </div>
  );
}
