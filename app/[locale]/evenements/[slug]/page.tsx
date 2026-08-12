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
  Download,
  Ticket,
  Loader2,
  Bed,
  Star,
  Car,
  Sparkles,
  Camera,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { PaymentButton } from "@/components/payment/payment-button";
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
  return `${s.toLocaleDateString("fr-FR", { day: "numeric" })} - ${e.toLocaleDateString("fr-FR", opts)}`;
}

export default function EventPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("event.page");
  const ts = useTranslations("event.success");
  const eventSlug = params.slug as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<"info" | "form" | "done">("info");
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    organisation: "",
    titre: "",
    useForBadge: true,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [ref, setRef] = useState("");
  const [ticketNum, setTicketNum] = useState(0);
  const [payError, setPayError] = useState("");
  const [selectedTarifId, setSelectedTarifId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const displayRef = ref;
  const hasLogement = event?.offreLogement && event.residence && event.residence.tarifs.length > 0;
  const selectedTarif = hasLogement ? event!.residence!.tarifs.find((t) => t.id === selectedTarifId) : null;

  useEffect(() => {
    fetch(`/api/events/${eventSlug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEvent(d.data);
      })
      .finally(() => setLoading(false));
  }, [eventSlug]);

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

  const getPhotoBase64 = async (): Promise<string | undefined> => {
    if (!photoFile) return undefined;
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(photoFile);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFree) return;
    setUploadingPhoto(true);
    setPayError("");

    try {
      const photoBase64 = !isConcert ? await getPhotoBase64() : undefined;

      const res = await fetch(`/api/events/${event.slug}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: form.prenom,
          nom: form.nom,
          email: form.email,
          telephone: form.telephone,
          organisation: form.organisation,
          titre: !isConcert ? form.titre || undefined : undefined,
          photo: photoBase64,
          type: isConcert ? "ticket" : "badge",
          montant: 0,
          residenceTarifId: selectedTarifId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRef(data.data.reference);
        setTicketNum(data.data.ticketNumber);
        setStep("done");
      } else {
        // Evenement complet, photo refusee, inscriptions fermees... :
        // on montre la vraie raison plutot qu'un faux QR code.
        setPayError(
          data.code === "EVENT_FULL"
            ? "Cet événement est complet."
            : data.error ?? "Inscription impossible. Réessayez.",
        );
      }
    } catch {
      setPayError("Connexion impossible. Vérifiez votre réseau et réessayez.");
    }

    setUploadingPhoto(false);
  };

  const saveParticipantBeforePay = async (): Promise<{
    participantRef?: string;
    eventSlug?: string;
    abort?: boolean;
    error?: string;
  }> => {
    setUploadingPhoto(true);
    try {
      const photoBase64 = !isConcert ? await getPhotoBase64() : undefined;

      const res = await fetch(`/api/events/${event.slug}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: form.prenom,
          nom: form.nom,
          email: form.email,
          telephone: form.telephone,
          organisation: form.organisation,
          titre: !isConcert ? form.titre || undefined : undefined,
          photo: photoBase64,
          type: isConcert ? "ticket" : "badge",
          residenceTarifId: selectedTarifId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        return { participantRef: data.data.reference, eventSlug: event.slug };
      }
      setUploadingPhoto(false);
      // Pas d'inscription enregistree = pas de debit.
      return {
        abort: true,
        error:
          data.code === "EVENT_FULL"
            ? "Cet événement est complet."
            : data.error ?? "Inscription impossible. Réessayez.",
      };
    } catch {
      setUploadingPhoto(false);
      return { abort: true, error: "Connexion impossible. Réessayez." };
    }
  };

  const handleDownloadQR = async () => {
    setDownloading(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const { jsPDF } = await import("jspdf");

      const qrValue = JSON.stringify({
        ref: displayRef,
        event: event.nom,
        name: `${form.prenom} ${form.nom}`,
        type: isConcert ? "ticket" : "badge",
        ticket: ticketNum,
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
      const evLines = doc.splitTextToSize(event.nom, 80);
      doc.text(evLines.slice(0, 2), 50, 20, { align: "center" });

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.text(`${formatDateRange(event.dateDebut, event.dateFin)} · ${event.lieu}`, 50, 28, { align: "center" });

      const qrSize = 55;
      doc.addImage(qrDataUrl, "PNG", (100 - qrSize) / 2, 34, qrSize, qrSize);

      doc.setTextColor(200, 169, 81);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text("REFERENCE", 50, 96, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(displayRef, 50, 103, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`${form.prenom} ${form.nom}`, 50, 112, { align: "center" });

      if (form.organisation) {
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text(form.organisation, 50, 118, { align: "center" });
      }

      doc.setTextColor(80, 80, 80);
      doc.setFontSize(4.5);
      doc.text("Presentez ce QR code a l'entree de l'evenement", 50, 132, { align: "center" });

      doc.save(`qr-${displayRef}.pdf`);
    } catch (err) {
      console.error("QR PDF error:", err);
    }
    setDownloading(false);
  };

  if (step === "done") {
    return (
      <section className="animate-fade-up">
        <div className="max-w-lg mx-auto px-5 lg:px-8 pt-10 pb-24">
          <div className="text-center mb-10">
            <CheckCircle2 className="w-16 h-16 text-ok mx-auto mb-5" />
            <h2 className="font-serif text-[32px] sm:text-[40px] text-ink">
              {ts("confirmed_badge")}
            </h2>
            <p className="text-mute mt-3 text-[15px] max-w-md mx-auto">
              {form.prenom}, téléchargez votre QR code et présentez-le à l&apos;entrée de <strong>{event.nom}</strong>
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="w-[340px] bg-ink rounded-2xl overflow-hidden shadow-float">
              <div className="bg-gold px-6 py-3 flex items-center justify-center">
                <span className="font-serif text-[18px] font-bold text-ink tracking-wide">AIKO BOARD</span>
              </div>

              <div className="px-6 pt-5 text-center">
                <p className="text-[13px] text-gold font-semibold">{event.nom}</p>
                <p className="text-[11px] text-cream/40 mt-1">{formatDateRange(event.dateDebut, event.dateFin)} · {event.lieu}</p>
              </div>

              <div className="flex items-center justify-center py-6">
                <QRCodeSVG
                  value={JSON.stringify({
                    ref: displayRef,
                    event: event.nom,
                    name: `${form.prenom} ${form.nom}`,
                    type: isConcert ? "ticket" : "badge",
                    ticket: ticketNum,
                  })}
                  size={180}
                  bgColor="transparent"
                  fgColor="#C8A951"
                  level="M"
                />
              </div>

              <div className="text-center pb-2">
                <p className="text-[10px] text-cream/40 uppercase tracking-widest">Reference</p>
                <p className="text-[22px] text-cream font-bold font-mono mt-1">{displayRef}</p>
              </div>

              <div className="text-center pb-5">
                <p className="text-[14px] text-cream font-semibold">{form.prenom} {form.nom}</p>
                {form.organisation && (
                  <p className="text-[11px] text-cream/40 mt-1">{form.organisation}</p>
                )}
              </div>

              <div className="text-center pb-4">
                <p className="text-[8px] text-cream/20 uppercase tracking-[0.3em]">Présentez ce QR code à l&apos;entrée</p>
              </div>
            </div>

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
          </div>

          <div className="mt-8 text-center space-y-3">
            <p className="text-[12px] text-mute">
              Perdu votre QR code ?{" "}
              <Link href={`/${locale}/mon-qr`} className="text-gold hover:text-gold2 font-medium underline underline-offset-2">
                Retrouvez-le ici
              </Link>
            </p>
            <Link href={`/${locale}`} className="text-[14px] text-gold hover:text-gold2 font-medium block">
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

              {!isConcert && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">Titre / Fonction</label>
                    <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Ex: Managing Director, Delegate, Speaker..." className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px]" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">Photo (pour le badge)</label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer inline-flex items-center gap-2.5 bg-cream2 border border-line hover:border-gold/40 rounded-xl px-5 py-3.5 text-[14px] text-mute transition-colors">
                        <Camera className="w-5 h-5 text-gold" />
                        {photoFile ? photoFile.name : "Choisir une photo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.size <= 5 * 1024 * 1024) {
                              setPhotoFile(file);
                              setPhotoPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                      {photoPreview && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-gold/30">
                          <Image src={photoPreview} alt="Photo" fill className="object-cover" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-mute mt-2">Format: JPG, PNG ou WebP. Max 5 Mo. Cette photo apparaitra sur votre badge imprime.</p>
                  </div>
                </>
              )}

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
