"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Loader2,
  RotateCcw,
  Camera,
  Printer,
  Keyboard,
} from "lucide-react";
import { generateSinglePvcBadge } from "@/lib/generate-pvc-badge-pdf";
import { loadManageToken, storeManageToken } from "@/lib/manage-token";

interface ScanResult {
  status: "success" | "error" | "warning";
  title: string;
  subtitle: string;
  detail?: string;
  ticketNumber?: number;
  participant?: {
    prenom: string;
    nom: string;
    email: string;
    organisation?: string;
    titre?: string;
    photoUrl?: string;
    reference: string;
    ticketNumber: number;
    type: string;
    event: {
      nom: string;
      slug: string;
      type: string;
      dateDebut?: string;
      dateFin?: string;
    };
  };
}

interface EventInfo {
  nom: string;
  slug: string;
  type: string;
  lieu: string;
  ville: string;
  dateDebut: string;
  dateFin: string;
  organisateur: string;
  _count: { participants: number };
}

function ScanPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const slug = params.slug as string;

  // Token de gestion : permet a l'organisateur de scanner sans compte admin.
  // Absent, l'API retombe sur la session admin AIKO.
  const urlToken = searchParams.get("token") ?? "";
  const [manageToken, setManageToken] = useState(urlToken);

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [totalCheckedIn, setTotalCheckedIn] = useState(0);
  const [cameraError, setCameraError] = useState("");
  const [streamInfo, setStreamInfo] = useState("");
  const [printing, setPrinting] = useState(false);
  const [manualRef, setManualRef] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (urlToken) {
      storeManageToken(slug, urlToken);
      return;
    }
    const stored = loadManageToken(slug);
    // localStorage n existe pas au prerendu : le token ne peut etre lu
    // qu apres le montage, d ou ce setState en effet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setManageToken(stored);
  }, [slug, urlToken]);

  useEffect(() => {
    fetch(`/api/events/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setEvent(d.data);
          setTotalCheckedIn(d.data.checkedInCount ?? 0);
        }
      })
      .catch(() => {});
  }, [slug]);

  const handleQrData = useCallback(async (raw: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    let ref = "";
    try {
      const parsed = JSON.parse(raw);
      ref = parsed.ref ?? "";
    } catch {
      if (raw.startsWith("AIKO-") || raw.startsWith("PAY-")) {
        ref = raw;
      }
    }

    if (!ref) {
      setResult({
        status: "error",
        title: "QR invalide",
        subtitle: "Ce code ne contient pas de reference AIKO Board.",
      });
      processingRef.current = false;
      return;
    }

    try {
      const query = manageToken
        ? `?token=${encodeURIComponent(manageToken)}&slug=${encodeURIComponent(slug)}`
        : "";
      const res = await fetch(`/api/participants/${ref}/checkin${query}`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setResult({
          status: "success",
          title: `${data.data.prenom} ${data.data.nom}`,
          subtitle: data.data.organisation ?? data.data.email,
          detail: `N°${String(data.data.ticketNumber).padStart(4, "0")}`,
          ticketNumber: data.data.ticketNumber,
          participant: data.data,
        });
        setScanCount((c) => c + 1);
        setTotalCheckedIn((c) => c + 1);
      } else if (data.code === "ALREADY_CHECKED_IN") {
        const at = data.data?.checkedInAt
          ? new Date(data.data.checkedInAt).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        setResult({
          status: "warning",
          title: `${data.data.prenom} ${data.data.nom}`,
          subtitle: `Deja scanne${at ? ` a ${at}` : ""}`,
          detail: `N°${String(data.data.ticketNumber).padStart(4, "0")}`,
          ticketNumber: data.data.ticketNumber,
          participant: data.data,
        });
      } else {
        setResult({
          status: "error",
          title: data.error ?? "Erreur",
          subtitle: ref,
        });
      }
    } catch {
      setResult({
        status: "error",
        title: "Erreur réseau",
        subtitle: "Vérifiez votre connexion internet.",
      });
    }

    processingRef.current = false;
  }, [manageToken, slug]);

  const handlePrintBadge = async () => {
    if (!result?.participant || !event) return;
    setPrinting(true);

    try {
      const QRCode = (await import("qrcode")).default;
      const p = result.participant;

      const qrValue = JSON.stringify({
        ref: p.reference,
        event: event.nom,
        name: `${p.prenom} ${p.nom}`,
        type: "badge",
        ticket: p.ticketNumber,
      });

      const qrDataUrl = await QRCode.toDataURL(qrValue, {
        width: 512,
        margin: 1,
        // Verso blanc : contraste standard, celui que les lecteurs attendent
        color: { dark: "#0A1628", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      });

      const fmtDate = (d: string) =>
        new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

      let photoDataUrl: string | undefined;
      if (p.photoUrl) {
        try {
          const imgRes = await fetch(p.photoUrl);
          const blob = await imgRes.blob();
          photoDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch {}
      }

      const pdf = generateSinglePvcBadge({
        eventName: event.nom,
        eventDate: `${fmtDate(event.dateDebut)} - ${fmtDate(event.dateFin)}`,
        eventLieu: `${event.lieu} · ${event.ville}`,
        eventType: event.type,
        organisateur: event.organisateur,
        participant: {
          name: `${p.prenom} ${p.nom}`,
          titre: p.titre,
          organisation: p.organisation ?? undefined,
          email: p.email,
          reference: p.reference,
          badgeNumber: p.ticketNumber,
          qrDataUrl,
          photoDataUrl,
        },
      });

      pdf.save(`badge-${p.reference}.pdf`);
    } catch (err) {
      console.error("Badge print error:", err);
    }

    setPrinting(false);
  };

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    setResult(null);
    setCameraError("");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      // Decodeur logiciel de la bibliotheque, volontairement.
      // Le decodeur natif du navigateur (BarcodeDetector) accelere Android
      // et Chrome, mais l'implementation de Safari 17 renvoie des resultats
      // vides sur le canvas que lui passe html5-qrcode : le scan marchait
      // sur ordinateur et jamais sur iPhone.
      const scanner = new Html5Qrcode("qr-reader", { verbose: false });
      html5QrRef.current = scanner;

      await scanner.start(
        // Camera arriere si elle existe, sans exiger : sur un appareil qui
        // n'en a pas, "exact" ferait echouer le demarrage.
        { facingMode: { ideal: "environment" } } as MediaTrackConstraints,
        {
          fps: 10,
          // Zone d'analyse calculee a partir du viseur reel plutot que
          // figee a 280 px : avec une valeur fixe et un aspectRatio force,
          // la zone scannee ne correspondait plus au cadre affiche — on
          // visait le QR sans qu'il soit jamais analyse.
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.8);
            return { width: size, height: size };
          },
        },
        (decodedText: string) => {
          handleQrData(decodedText);
          scanner.pause();
          setTimeout(() => {
            try {
              scanner.resume();
            } catch {
              // scanner may have been stopped
            }
          }, 2500);
        },
        () => {},
      );

      setScanning(true);

      // Resolution reellement obtenue : permet de diagnostiquer un echec
      // sans avoir le telephone en main.
      setTimeout(() => {
        const video = document.querySelector<HTMLVideoElement>("#qr-reader video");
        if (video?.videoWidth) setStreamInfo(`${video.videoWidth}x${video.videoHeight}`);
      }, 1200);
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? err.message
          : "Impossible d'acceder à la camera"
      );
    }
  }, [handleQrData]);

  const stopScanner = useCallback(async () => {
    try {
      const scanner = html5QrRef.current as { stop: () => Promise<void> } | null;
      if (scanner) await scanner.stop();
    } catch {
      // already stopped
    }
    html5QrRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const resetScan = () => {
    setResult(null);
    processingRef.current = false;
  };

  return (
    <section className="animate-fade-up min-h-screen bg-ink text-cream">
      <div className="max-w-lg mx-auto px-5 pt-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/${locale}/organisateur/${slug}`}
            className="text-[13px] text-cream/50 hover:text-cream flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2 text-[12px] text-cream/40">
            <Users className="w-3.5 h-3.5" />
            <span className="font-variant-numeric tabular-nums">
              {totalCheckedIn} / {event?._count.participants ?? "—"}
            </span>
          </div>
        </div>

        {/* Event name */}
        <div className="text-center mb-6">
          <h1 className="font-serif text-[24px] text-cream">
            {event?.nom ?? "Chargement..."}
          </h1>
          <p className="text-[12px] text-cream/40 mt-1 uppercase tracking-wider">
            Scanner &amp; imprimer les badges
          </p>
        </div>

        {/* Scanner area — pas de ratio impose : la camera d'un telephone
            rend du 4:3 ou du 16:9, et forcer un carre rognait l'image
            affichee sans rogner l'image analysee. */}
        <div className="relative rounded-2xl overflow-hidden bg-black mb-6">
          <div
            id="qr-reader"
            ref={scannerRef}
            className="w-full"
            style={{ minHeight: 320 }}
          />

          {!scanning && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <Camera className="w-12 h-12 text-cream/30 mb-4" />
              <button
                onClick={startScanner}
                className="bg-gold hover:bg-gold2 text-ink rounded-full px-8 py-4 text-[15px] font-semibold flex items-center gap-2"
              >
                <ScanLine className="w-5 h-5" />
                Demarrer le scan
              </button>
            </div>
          )}

          {scanning && streamInfo && (
            <div className="absolute bottom-2 left-2 bg-black/60 rounded-lg px-2.5 py-1">
              <p className="text-[10px] text-cream/50 mono">Camera {streamInfo}</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
              <XCircle className="w-10 h-10 text-err mb-3" />
              <p className="text-[14px] text-cream mb-2">Camera indisponible</p>
              <p className="text-[12px] text-cream/40 mb-4">{cameraError}</p>
              <button
                onClick={startScanner}
                className="text-gold text-[13px] font-medium"
              >
                Reessayer
              </button>
            </div>
          )}

          {scanning && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <button
                onClick={stopScanner}
                className="bg-black/60 backdrop-blur text-cream/70 rounded-full px-4 py-2 text-[12px] flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Arreter
              </button>
            </div>
          )}
        </div>

        {/* Manual reference entry */}
        <div className="mb-6">
          <p className="text-[11px] text-cream/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" />
            Saisie manuelle
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const trimmed = manualRef.trim().toUpperCase();
              if (!trimmed) return;
              setManualLoading(true);
              await handleQrData(trimmed);
              setManualLoading(false);
            }}
            className="flex gap-2"
          >
            <input
              value={manualRef}
              onChange={(e) => setManualRef(e.target.value)}
              placeholder="AIKO-XXXXXX"
              className="flex-1 bg-cream/[0.06] border border-cream/[0.12] rounded-xl px-4 py-3 text-[14px] font-mono text-cream uppercase placeholder:text-cream/20"
            />
            <button
              type="submit"
              disabled={manualLoading || !manualRef.trim()}
              className="bg-gold hover:bg-gold2 text-ink rounded-xl px-5 py-3 text-[13px] font-semibold disabled:opacity-40 flex items-center gap-1.5"
            >
              {manualLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              Verifier
            </button>
          </form>
        </div>

        {/* Result card */}
        {result && (
          <div
            className={`rounded-2xl p-6 mb-6 animate-fade-up ${
              result.status === "success"
                ? "bg-ok/15 border border-ok/20"
                : result.status === "warning"
                ? "bg-gold/15 border border-gold/20"
                : "bg-err/15 border border-err/20"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5">
                {result.status === "success" && (
                  <CheckCircle2 className="w-8 h-8 text-ok" />
                )}
                {result.status === "warning" && (
                  <AlertTriangle className="w-8 h-8 text-gold" />
                )}
                {result.status === "error" && (
                  <XCircle className="w-8 h-8 text-err" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-[20px] text-cream leading-tight">
                  {result.title}
                </p>
                <p className="text-[13px] text-cream/60 mt-1">
                  {result.subtitle}
                </p>
                {result.detail && (
                  <p className="text-[12px] text-cream/40 mt-1 font-mono">
                    {result.detail}
                  </p>
                )}
              </div>
            </div>

            {/* Print PVC badge button — shown on success or already checked in */}
            {result.participant && (
              <button
                onClick={handlePrintBadge}
                disabled={printing}
                className="mt-4 w-full bg-gold hover:bg-gold2 text-ink rounded-xl py-3.5 text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {printing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                {printing ? "Génération du badge..." : "Imprimer le badge"}
              </button>
            )}

            <button
              onClick={resetScan}
              className="mt-3 w-full bg-cream/10 hover:bg-cream/15 text-cream rounded-xl py-3 text-[13px] font-medium flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Scanner suivant
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-cream/[0.04] border border-cream/[0.08] rounded-xl p-4 text-center">
            <p className="font-serif text-[28px] text-gold tabular-nums">
              {scanCount}
            </p>
            <p className="text-[11px] text-cream/40 uppercase tracking-wider mt-1">
              Scannes cette session
            </p>
          </div>
          <div className="bg-cream/[0.04] border border-cream/[0.08] rounded-xl p-4 text-center">
            <p className="font-serif text-[28px] text-cream tabular-nums">
              {totalCheckedIn}
            </p>
            <p className="text-[11px] text-cream/40 uppercase tracking-wider mt-1">
              Check-ins total
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      }
    >
      <ScanPageContent />
    </Suspense>
  );
}
