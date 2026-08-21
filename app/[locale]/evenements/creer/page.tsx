"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  CheckCircle2,
  Copy,
  ExternalLink,
  Mic,
  Music,
  Building2,
  Code2,
  Bed,
  Car,
  Ticket,
  Sparkles,
  Landmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PaymentButton } from "@/components/payment/payment-button";
import { ImageUpload } from "@/components/ui/image-upload";
import { storeManageToken } from "@/lib/manage-token";
import { ServicePicker } from "@/components/services/service-picker";

type EventType = "conference" | "concert" | "salon" | "hackathon";

interface EventForm {
  name: string;
  type: EventType;
  description: string;
  dateStart: string;
  dateEnd: string;
  lieu: string;
  ville: string;
  capacite: string;
  badgePayant: boolean;
  prixBadge: string;
  ticketPayant: boolean;
  prixTicket: string;
  offreLogement: boolean;
  offreVehicule: boolean;
  offreExtras: boolean;
  serviceIds: string[];
  residenceIds: string[];
  institutionnel: boolean;
  residenceId: string;
  contactEmail: string;
  contactTel: string;
  organisateur: string;
  logoUrl: string;
  coverUrl: string;
}

interface ResidenceOption {
  id: string;
  nom: string;
  ville: string;
  type: string;
  quartier: string | null;
  images?: { id: string; url: string }[];
  tarifs?: { id: string; prixParNuit: number }[];
}

const EVENT_TYPES: { value: EventType; label: string; icon: LucideIcon }[] = [
  { value: "conference", label: "Conférence", icon: Mic },
  { value: "concert", label: "Concert", icon: Music },
  { value: "salon", label: "Salon / Expo", icon: Building2 },
  { value: "hackathon", label: "Hackathon", icon: Code2 },
];

export default function CreerPage() {
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<EventForm>({
    name: "",
    type: "conference",
    description: "",
    dateStart: "",
    dateEnd: "",
    lieu: "",
    ville: "",
    capacite: "",
    badgePayant: false,
    prixBadge: "",
    ticketPayant: false,
    prixTicket: "",
    offreLogement: false,
    offreVehicule: false,
    offreExtras: false,
    serviceIds: [],
    residenceIds: [],
    institutionnel: false,
    residenceId: "",
    contactEmail: "",
    contactTel: "",
    organisateur: "",
    logoUrl: "",
    coverUrl: "",
  });
  const [eventSlug, setEventSlug] = useState("");
  const [payError, setPayError] = useState("");
  const [residences, setResidences] = useState<ResidenceOption[]>([]);

  useEffect(() => {
    fetch("/api/residences")
      .then((r) => r.json())
      .then((d) => { if (d.success) setResidences(d.data); })
      .catch(() => {});
  }, []);

  const update = (patch: Partial<EventForm>) => setForm({ ...form, ...patch });
  const isConcert = form.type === "concert";

  const saveEventBeforePay = async (): Promise<{
    eventSlug?: string;
    abort?: boolean;
    error?: string;
  }> => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.name,
          type: form.type,
          description: form.description,
          organisateur: form.organisateur,
          lieu: form.lieu,
          ville: form.ville,
          dateDebut: form.dateStart,
          dateFin: form.dateEnd || form.dateStart,
          capacite: form.capacite,
          badgePayant: form.badgePayant,
          prixBadge: form.prixBadge,
          ticketPayant: form.ticketPayant,
          prixTicket: form.prixTicket,
          offreLogement: form.offreLogement,
          offreVehicule: form.offreVehicule,
          offreExtras: form.offreExtras,
          serviceIds: form.serviceIds,
          residenceIds: form.residenceIds,
          institutionnel: form.institutionnel,
          residenceId: form.residenceId || undefined,
          contactEmail: form.contactEmail,
          contactTel: form.contactTel,
          logoUrl: form.logoUrl || undefined,
          coverUrl: form.coverUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEventSlug(data.slug);
        // Cle privee du tableau de bord : conservee ici pour un retour
        // immediat apres paiement, et envoyee par email a l'organisateur.
        if (data.manageToken) storeManageToken(data.slug, data.manageToken);
        return { eventSlug: data.slug };
      }
      // Pas d'evenement enregistre = pas de debit.
      return { abort: true, error: data.error ?? "Création impossible. Réessayez." };
    } catch {
      return { abort: true, error: "Connexion impossible. Réessayez." };
    }
  };

  if (step === 4) {
    const slug = eventSlug;
    const eventUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/evenements/${slug}`;

    return (
      <section className="animate-fade-up">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 pt-10 pb-24">
          <div className="text-center mb-12">
            <CheckCircle2 className="w-16 h-16 text-ok mx-auto mb-5" />
            <h2 className="font-serif text-[36px] sm:text-[44px] text-ink">
              {"É"}v{"é"}nement cr{"é"}{"é"} !
            </h2>
            <p className="text-mute mt-3 text-[16px] max-w-lg mx-auto">
              <strong>{form.name}</strong> est en ligne. Partagez le lien avec vos participants.
            </p>
          </div>

          <div className="w-[380px] mx-auto bg-ink rounded-2xl overflow-hidden shadow-float mb-8">
            <div className="bg-gold px-6 py-4 flex items-center justify-between">
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#0A0A0A", letterSpacing: "0.04em" }}>
                A{"Ï"}KO
              </span>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#0A0A0A", fontWeight: 600 }}>
                Organisateur
              </span>
            </div>

            <div className="px-6 pt-5 pb-3">
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#fff", lineHeight: 1.2 }}>
                {form.name}
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{form.organisateur}</p>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 24px" }} />

            <div className="px-6 py-4">
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                {form.dateStart} → {form.dateEnd}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
                {form.lieu} · {form.ville}
              </p>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 24px" }} />

            <div className="px-6 py-5 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)" }}>
              <QRCodeSVG
                value={eventUrl}
                size={150}
                bgColor="transparent"
                fgColor="#C8A951"
                level="M"
              />
            </div>

            <div className="px-6 pb-4 text-center">
              <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)" }}>
                QR Code de l&apos;{"é"}v{"é"}nement
              </p>
            </div>
          </div>

          <div className="bg-cream2 border border-line rounded-2xl p-5 mb-8">
            <p className="text-[12px] uppercase tracking-wider text-mute mb-3">Lien d&apos;inscription participants</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={eventUrl}
                className="flex-1 bg-white border border-line rounded-xl px-4 py-3 text-[14px] mono"
              />
              <button
                onClick={() => navigator.clipboard?.writeText(eventUrl)}
                className="btn-press bg-ink text-cream rounded-xl px-4 py-3"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-cream2 border border-line rounded-2xl p-5 mb-8">
            <p className="text-[12px] uppercase tracking-wider text-mute mb-3">R{"é"}capitulatif facturation</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-ink">Cr{"é"}ation d&apos;{"é"}v{"é"}nement</span>
                <span className="text-[14px] text-ink font-semibold">50 {"€"}</span>
              </div>
              {form.badgePayant && (
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-mute">Frais d&apos;identification badge</span>
                  <span className="text-[14px] text-mute">10 {"€"} / badge</span>
                </div>
              )}
              {isConcert && form.ticketPayant && (
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-mute">Commission tickets</span>
                  <span className="text-[14px] text-mute">10% / vente</span>
                </div>
              )}
              <div className="border-t border-line pt-3 flex items-center justify-between">
                <span className="text-[14px] text-ink font-medium">Total d{"û"} maintenant</span>
                <span className="font-serif text-[24px] text-ink">50 {"€"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/organisateur/${slug}`}
              className="btn-press inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-8 py-4 text-[15px] font-semibold"
            >
              <Users className="w-4 h-4" />
              Mon dashboard organisateur
            </Link>
            <Link
              href={`/${locale}/evenements/${slug}`}
              className="btn-press inline-flex items-center gap-2 bg-ink hover:bg-ink2 text-cream rounded-full px-6 py-3 text-[14px] font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Page publique
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-fade-up">
      <div className="max-w-3xl mx-auto px-5 lg:px-8 pt-10 pb-24">
        <Link href={`/${locale}`} className="text-[13px] text-mute hover:text-ink flex items-center gap-1.5 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full flex-1 transition-all ${
                s <= step ? "bg-gold" : "bg-line"
              }`}
            />
          ))}
        </div>

        <h1 className="font-serif text-[32px] sm:text-[40px] text-ink mb-2">
          Cr{"é"}er votre {"é"}v{"é"}nement
        </h1>
        <p className="text-mute text-[14px] mb-10">
          {"É"}tape {step} sur 3 — {step === 1 ? "Informations générales" : step === 2 ? "Lieu & dates" : "Tarification & contact"}
        </p>

        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">Nom de l&apos;{"é"}v{"é"}nement</label>
              <input
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="ex: Summit Tech Abidjan 2026"
                className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">Type d&apos;{"é"}v{"é"}nement</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update({ type: t.value })}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      form.type === t.value
                        ? "border-gold bg-gold/10"
                        : "border-line bg-cream2 hover:border-gold/30"
                    }`}
                  >
                    <t.icon className="w-6 h-6 mx-auto mb-2 text-gold" />
                    <span className="text-[13px] font-medium text-ink">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">Organisateur / Entreprise</label>
              <input
                value={form.organisateur}
                onChange={(e) => update({ organisateur: e.target.value })}
                placeholder="ex: AIKO Group"
                className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="Décrivez votre événement en quelques lignes..."
                rows={4}
                className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px] resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <ImageUpload
                value={form.logoUrl}
                onChange={(url) => update({ logoUrl: url })}
                folder="logos"
                aspect="square"
                label={`Logo de l'événement`}
                placeholder="Logo (carre)"
              />
              <ImageUpload
                value={form.coverUrl}
                onChange={(url) => update({ coverUrl: url })}
                folder="covers"
                aspect="cover"
                label="Image de couverture"
                placeholder="Cover (panoramique)"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                disabled={!form.name || !form.organisateur}
                className="btn-press inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-8 py-4 text-[15px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">Date de d{"é"}but</label>
                <input
                  type="date"
                  value={form.dateStart}
                  onChange={(e) => update({ dateStart: e.target.value })}
                  className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">Date de fin</label>
                <input
                  type="date"
                  value={form.dateEnd}
                  onChange={(e) => update({ dateEnd: e.target.value })}
                  className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">Lieu / Salle</label>
              <input
                value={form.lieu}
                onChange={(e) => update({ lieu: e.target.value })}
                placeholder="ex: Sofitel Hôtel Ivoire"
                className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">Ville</label>
              <input
                value={form.ville}
                onChange={(e) => update({ ville: e.target.value })}
                placeholder="ex: Abidjan"
                className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">Capacit{"é"} (nombre de places)</label>
              <input
                type="number"
                value={form.capacite}
                onChange={(e) => update({ capacite: e.target.value })}
                placeholder="ex: 500"
                className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px]"
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="text-[14px] text-mute hover:text-ink flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Pr{"é"}c{"é"}dent
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.dateStart || !form.lieu || !form.ville}
                className="btn-press inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-8 py-4 text-[15px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <p className="text-[12px] font-medium text-ink mb-3 uppercase tracking-wider">
                Services propos{"é"}s par l&apos;{"é"}v{"é"}nement
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className={`flex items-start gap-3 cursor-pointer bg-cream2 border rounded-2xl p-4 transition-all ${form.offreLogement ? "border-gold bg-gold/5" : "border-line"}`}>
                  <input
                    type="checkbox"
                    checked={form.offreLogement}
                    onChange={(e) => update({ offreLogement: e.target.checked })}
                    className="accent-gold w-5 h-5 mt-0.5"
                  />
                  <div className="flex items-start gap-2">
                    <Bed className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] text-ink font-medium">Logement</p>
                      <p className="text-[11px] text-mute mt-0.5">H{"é"}bergement pour les participants</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 cursor-pointer bg-cream2 border rounded-2xl p-4 transition-all ${form.badgePayant ? "border-gold bg-gold/5" : "border-line"}`}>
                  <input
                    type="checkbox"
                    checked={form.badgePayant}
                    onChange={(e) => update({ badgePayant: e.target.checked })}
                    className="accent-gold w-5 h-5 mt-0.5"
                  />
                  <div className="flex items-start gap-2">
                    <Ticket className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] text-ink font-medium">Badge / Ticket payant</p>
                      <p className="text-[11px] text-mute mt-0.5">Accr{"é"}ditation ou entr{"é"}e payante</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 cursor-pointer bg-cream2 border rounded-2xl p-4 transition-all ${form.offreVehicule ? "border-gold bg-gold/5" : "border-line"}`}>
                  <input
                    type="checkbox"
                    checked={form.offreVehicule}
                    onChange={(e) => update({ offreVehicule: e.target.checked })}
                    className="accent-gold w-5 h-5 mt-0.5"
                  />
                  <div className="flex items-start gap-2">
                    <Car className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] text-ink font-medium">V{"é"}hicule / D{"é"}placement</p>
                      <p className="text-[11px] text-mute mt-0.5">Transport et navettes</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 cursor-pointer bg-cream2 border rounded-2xl p-4 transition-all ${form.offreExtras ? "border-gold bg-gold/5" : "border-line"}`}>
                  <input
                    type="checkbox"
                    checked={form.offreExtras}
                    onChange={(e) => update({ offreExtras: e.target.checked })}
                    className="accent-gold w-5 h-5 mt-0.5"
                  />
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] text-ink font-medium">Services suppl{"é"}mentaires</p>
                      <p className="text-[11px] text-mute mt-0.5">Restauration, excursions, extras</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 cursor-pointer bg-cream2 border rounded-2xl p-4 transition-all ${form.institutionnel ? "border-gold bg-gold/5" : "border-line"}`}>
                  <input
                    type="checkbox"
                    checked={form.institutionnel}
                    onChange={(e) => update({ institutionnel: e.target.checked })}
                    className="accent-gold w-5 h-5 mt-0.5"
                  />
                  <div className="flex items-start gap-2">
                    <Landmark className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] text-ink font-medium">Institutionnel</p>
                      <p className="text-[11px] text-mute mt-0.5">D{"é"}l{"é"}gations VIP, protocole</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <p className="text-[12px] font-medium text-ink mb-1 uppercase tracking-wider">
                Conciergerie {"&"} services suppl{"é"}mentaires
              </p>
              <p className="text-[12px] text-mute mb-4">
                Cochez ce que votre pack inclut. Vos participants pourront
                ensuite demander ces prestations au moment de leur inscription.
              </p>
              <ServicePicker
                catalog
                selected={form.serviceIds}
                onChange={(serviceIds) => update({ serviceIds })}
              />
            </div>

            {residences.length > 0 && (
              <div>
                <p className="text-[12px] font-medium text-ink mb-1 uppercase tracking-wider">
                  H{"é"}bergements propos{"é"}s
                </p>
                <p className="text-[12px] text-mute mb-3">
                  Ces r{"é"}sidences viennent de notre parc r{"é"}el, avec leurs
                  photos et leurs tarifs. Vos participants choisiront parmi
                  celles que vous cochez ici.
                </p>

                <div className="flex items-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        residenceIds:
                          form.residenceIds.length === residences.length
                            ? []
                            : residences.map((r) => r.id),
                      })
                    }
                    className="text-[12px] text-ink border border-line rounded-full px-3 py-1.5 hover:border-gold/50"
                  >
                    {form.residenceIds.length === residences.length
                      ? "Tout d\u00e9cocher"
                      : "Tout proposer"}
                  </button>
                  <span className="text-[12px] text-mute">
                    {form.residenceIds.length} / {residences.length} s{"é"}lectionn{"é"}e(s)
                  </span>
                  <a
                    href={`/${locale}/residences`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] text-gold hover:underline ml-auto"
                  >
                    Voir le catalogue
                  </a>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {residences.map((r) => {
                    const actif = form.residenceIds.includes(r.id);
                    const prix =
                      r.tarifs && r.tarifs.length > 0
                        ? Math.min(...r.tarifs.map((t) => t.prixParNuit))
                        : null;
                    return (
                      <label
                        key={r.id}
                        className={`flex items-start gap-2.5 cursor-pointer border rounded-xl p-2.5 transition-all min-w-0 ${
                          actif ? "border-gold bg-gold/5" : "border-line bg-cream2 hover:border-gold/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={actif}
                          onChange={() =>
                            update({
                              residenceIds: actif
                                ? form.residenceIds.filter((id) => id !== r.id)
                                : [...form.residenceIds, r.id],
                            })
                          }
                          className="accent-gold w-4 h-4 mt-0.5 shrink-0"
                        />
                        {r.images && r.images.length > 0 && (
                          <span className="relative h-11 w-14 shrink-0 rounded-lg overflow-hidden bg-line">
                            <Image
                              src={r.images[0].url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block text-[13px] text-ink font-medium truncate">{r.nom}</span>
                          <span className="block text-[11px] text-mute truncate">
                            {r.quartier ? `${r.quartier}, ` : ""}{r.ville}
                          </span>
                          <span className="block text-[11px] text-gold mt-0.5">
                            {prix
                              ? `${new Intl.NumberFormat("fr-FR").format(prix)} XOF / nuit`
                              : "tarif \u00e0 d\u00e9finir"}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {form.offreLogement && residences.length > 0 && (
              <div className="animate-fade-up">
                <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                  R{"é"}sidence associ{"é"}e
                </label>
                <select
                  value={form.residenceId}
                  onChange={(e) => update({ residenceId: e.target.value })}
                  className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px]"
                >
                  <option value="">-- Choisir une r{"é"}sidence --</option>
                  {residences.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nom} ({r.type}) — {r.quartier ? `${r.quartier}, ` : ""}{r.ville}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.badgePayant && (
              <div className="bg-cream2 border border-gold/20 rounded-2xl p-5 animate-fade-up">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">Prix du badge (XOF)</label>
                    <input
                      type="number"
                      value={form.prixBadge}
                      onChange={(e) => update({ prixBadge: e.target.value })}
                      placeholder="ex: 5000"
                      className="w-full bg-white border border-line rounded-xl px-4 py-3.5 text-[15px]"
                    />
                  </div>
                  {isConcert && (
                    <div>
                      <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">Prix du ticket (XOF)</label>
                      <input
                        type="number"
                        value={form.prixTicket}
                        onChange={(e) => update({ prixTicket: e.target.value })}
                        placeholder="ex: 15000"
                        className="w-full bg-white border border-line rounded-xl px-4 py-3.5 text-[15px]"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ height: 1 }} className="bg-line" />

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">Email de contact</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => update({ contactEmail: e.target.value })}
                  placeholder="contact@votre-entreprise.com"
                  className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">T{"é"}l{"é"}phone</label>
                <input
                  value={form.contactTel}
                  onChange={(e) => update({ contactTel: e.target.value })}
                  placeholder="+225 07 00 00 00 00"
                  className="w-full bg-cream2 border border-line rounded-xl px-4 py-3.5 text-[15px] mono"
                />
              </div>
            </div>

            <div className="bg-ink rounded-2xl p-6 text-cream">
              <p className="text-[12px] uppercase tracking-wider text-cream/40 mb-4">Votre facture</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px]">Cr{"é"}ation d&apos;{"é"}v{"é"}nement A{"Ï"}KO</span>
                <span className="font-serif text-[20px] text-gold">50 {"€"}</span>
              </div>
              <p className="text-[11px] text-cream/30">
                {form.badgePayant && `· 10 € / badge payant délivré  `}
                {isConcert && form.ticketPayant && "· 10% / ticket vendu"}
              </p>
            </div>

            {payError && (
              <div className="bg-err/10 border border-err/20 text-err rounded-xl px-4 py-3 text-[13px]">
                {payError}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="text-[14px] text-mute hover:text-ink flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Pr{"é"}c{"é"}dent
              </button>
              <PaymentButton
                amount={32500}
                currency="XOF"
                description={`Création événement AIKO — ${form.name}`}
                customerName={form.organisateur}
                customerEmail={form.contactEmail}
                customerPhone={form.contactTel}
                type="event_creation"
                onBeforePay={saveEventBeforePay}
                onError={setPayError}
                disabled={!form.contactEmail}
                label="Payer 50 € et créer"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
