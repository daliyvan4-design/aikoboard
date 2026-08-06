"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { PaymentButton } from "@/components/payment/payment-button";
import type { CartState, TravelerData } from "./wizard-shell";
import type { ServiceGroups, ServiceItem } from "@/components/services/types";
import { fmt } from "@/lib/utils";

/* ---------- helpers ---------- */

function genRef(): string {
  const hex = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `AIKO-26-${hex}`;
}

interface LineItem {
  name: string;
  sub?: string;
  qty: number | string;
  unit: number;
  total: number;
}

function buildLineItems(
  cart: CartState,
  services: ServiceGroups,
): LineItem[] {
  const lines: LineItem[] = [];

  // Transport
  for (const [id, q] of Object.entries(cart.transport)) {
    const s = services.transport.find((x) => x.id === id);
    if (!s) continue;
    lines.push({
      name: s.nom,
      qty: q,
      unit: s.prixBase,
      total: q * s.prixBase,
    });
  }

  // Hotel
  if (cart.hotel) {
    const h = services.hebergement.find((x) => x.id === cart.hotel!.id);
    if (h) {
      lines.push({
        name: `${h.nom}${h.quartier ? ` · ${h.quartier}` : ""}`,
        sub: "nuits",
        qty: cart.hotel.nights,
        unit: h.prixBase,
        total: cart.hotel.nights * h.prixBase,
      });
    }
  }

  // Meals
  for (const id of Object.keys(cart.meals)) {
    const m = services.repas.find((x) => x.id === id);
    if (!m) continue;
    const qty = cart.pax * (cart.hotel ? cart.hotel.nights : 1);
    if (m.prixBase === 0) {
      lines.push({ name: m.nom, sub: "inclus", qty: "—", unit: 0, total: 0 });
    } else {
      lines.push({
        name: m.nom,
        sub: "/ pax",
        qty,
        unit: m.prixBase,
        total: qty * m.prixBase,
      });
    }
  }

  // Extras
  const extrasArr = cart.extras instanceof Set ? Array.from(cart.extras) : [];
  for (const id of extrasArr) {
    const x = services.extra.find((y) => y.id === id);
    if (!x) continue;
    lines.push({ name: x.nom, qty: 1, unit: x.prixBase, total: x.prixBase });
  }

  return lines;
}

/* ---------- props ---------- */

interface StepRecapProps {
  cart: CartState;
  traveler: TravelerData;
  currency: string;
  setCurrency: (c: string) => void;
  onBack: () => void;
  onSubmit: (ref: string) => void;
}

/* ---------- component ---------- */

export function StepRecap({
  cart,
  traveler,
  currency,
  setCurrency,
  onBack,
  onSubmit,
}: StepRecapProps) {
  const t = useTranslations("s4");
  const [services, setServices] = useState<ServiceGroups | null>(null);
  const [cgvChecked, setCgvChecked] = useState(false);
  const [payError, setPayError] = useState("");
  const [ref] = useState(genRef);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data: ServiceGroups) => setServices(data))
      .catch(() => {});
  }, []);

  const lines = useMemo(
    () => (services ? buildLineItems(cart, services) : []),
    [cart, services],
  );

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const tva = Math.round(subtotal * 0.18);
  const fee = subtotal > 0 ? 25000 : 0;
  const totalTTC = subtotal + tva + fee;

  const isEmpty =
    Object.keys(cart.transport).length === 0 &&
    !cart.hotel &&
    Object.keys(cart.meals).length === 0 &&
    (cart.extras instanceof Set ? cart.extras.size === 0 : true);

  /* visa label */
  const visaMap: Record<string, string> = {
    ok: "Déjà obtenu",
    pending: "En cours",
    need: "Assistance demandée",
  };

  /* ---------- empty state ---------- */
  if (isEmpty) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-24 text-center">
        <p className="text-mute text-[14px]">{t("empty")}</p>
        <button
          onClick={onBack}
          className="mt-4 text-gold hover:text-gold2 font-semibold text-[14px]"
        >
          {t("compose")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-10 pb-24">
      {/* header */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="text-[13px] text-mute hover:text-ink flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("back")}</span>
          </button>
          <span className="text-[11px] uppercase tracking-[0.22em] text-mute">
            {t("step")}
          </span>
        </div>

        {/* step pills */}
        <div className="flex items-center gap-3">
          <span className="pill-step bg-ok text-cream">
            <Check className="w-3 h-3" />
          </span>
          <span className="pill-line bg-ok" />
          <span className="pill-step bg-ok text-cream">
            <Check className="w-3 h-3" />
          </span>
          <span className="pill-line bg-ok" />
          <span className="pill-step bg-ink text-gold">3</span>
        </div>

        <h2 className="font-serif text-[32px] sm:text-[40px] text-ink mt-6">
          {t("title")}
        </h2>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* ============ LEFT: recap (60%) ============ */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-line shadow-card overflow-hidden">
            {/* detail header + currency */}
            <div className="p-6 sm:p-8 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-[22px] text-ink">
                  {t("detail")}
                </h3>
                <p className="text-[13px] text-mute mt-1">
                  {t("ref_prov")}{" "}
                  <span className="mono">{ref}</span>
                </p>
              </div>
              {/* Currency switcher */}
              <div className="inline-flex bg-cream border border-line rounded-full p-1 text-[12px]">
                {(["XOF", "EUR", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`px-3 py-1.5 rounded-full font-medium mono ${
                      currency === c
                        ? "bg-ink text-cream"
                        : "text-mute"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="hr" />

            {/* table headers */}
            <div className="px-6 sm:px-8 py-3 grid grid-cols-12 text-[11px] uppercase tracking-[0.18em] text-mute">
              <div className="col-span-6">{t("col.service")}</div>
              <div className="col-span-2 text-center">{t("col.qty")}</div>
              <div className="col-span-2 text-right">{t("col.unit")}</div>
              <div className="col-span-2 text-right">{t("col.total")}</div>
            </div>
            <div className="hr" />

            {/* line items */}
            <div className="px-6 sm:px-8 py-2 divide-y divide-line">
              {lines.map((l, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 items-center py-3 text-[13px]"
                >
                  <div className="col-span-6 flex items-center gap-3">
                    <div>
                      <p className="text-ink font-medium">{l.name}</p>
                      {l.sub && (
                        <p className="text-[11px] text-mute">{l.sub}</p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 text-center mono text-ink">
                    {l.qty}
                  </div>
                  <div className="col-span-2 text-right mono text-mute">
                    {l.total ? fmt(l.unit, currency) : "—"}
                  </div>
                  <div className="col-span-2 text-right mono text-ink font-semibold">
                    {l.total ? fmt(l.total, currency) : "Inclus"}
                  </div>
                </div>
              ))}
            </div>

            <div className="hr" />

            {/* subtotal / tva / fee */}
            <div className="px-6 sm:px-8 py-5 flex items-center justify-between text-[13px] text-mute">
              <span>{t("subtotal")}</span>
              <span className="mono">{fmt(subtotal, currency)}</span>
            </div>
            <div className="px-6 sm:px-8 pb-2 flex items-center justify-between text-[13px] text-mute">
              <span>{t("vat")}</span>
              <span className="mono">{fmt(tva, currency)}</span>
            </div>
            <div className="px-6 sm:px-8 pb-2 flex items-center justify-between text-[13px] text-mute">
              <span>{t("fee")}</span>
              <span className="mono">{fmt(fee, currency)}</span>
            </div>

            <div className="hr mx-6 sm:mx-8" />

            {/* total TTC */}
            <div className="px-6 sm:px-8 py-6 flex items-end justify-between bg-cream2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-mute">
                  {t("total_ttc")}
                </p>
                <p className="text-[12px] text-mute mt-1">{t("total_sub")}</p>
              </div>
              <p className="figure text-[42px] text-ink">
                {fmt(totalTTC, currency)}
              </p>
            </div>
          </div>

          {/* promo + insurance */}
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <div className="bg-white border border-line rounded-2xl p-4 flex items-center gap-3">
              <Ticket className="text-gold w-5 h-5 shrink-0" />
              <input
                placeholder={t("promo")}
                className="flex-1 bg-transparent text-[14px] outline-none"
              />
              <button className="text-[12px] text-ink font-semibold hover:text-gold2">
                {t("apply")}
              </button>
            </div>
            <label className="bg-white border border-line rounded-2xl p-4 flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="accent-gold w-4 h-4"
              />
              <div className="flex-1">
                <p className="text-[13px] text-ink font-medium">
                  {t("ins.title")}
                </p>
                <p className="text-[11px] text-mute">
                  {t("ins.desc")}{" "}
                  <span className="mono">
                    +{fmt(Math.round(totalTTC * 0.05), currency)}
                  </span>
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* ============ RIGHT: payment (40%) ============ */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-line shadow-card p-6 sm:p-8 sticky top-24">
            <h3 className="font-serif text-[22px] text-ink">
              {t("pay.title")}
            </h3>

            {/* traveler summary */}
            <div className="mt-5 bg-cream rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-mute">
                    {t("pay.traveler")}
                  </p>
                  <p className="font-serif text-[18px] text-ink mt-1">
                    {traveler.prenom} {traveler.nom}
                  </p>
                  <p className="text-[12px] text-mute">
                    {traveler.dateArrivee} → {traveler.dateDepart} ·{" "}
                    {traveler.nombrePersonnes} personne
                    {traveler.nombrePersonnes > 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={onBack}
                  className="text-[12px] text-gold hover:text-gold2 font-medium"
                >
                  {t("pay.modify")}
                </button>
              </div>
              <div className="hr my-3" />
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-mute">
                    {t("pay.flight")}
                  </p>
                  <p className="mt-0.5 text-ink mono">
                    {traveler.numeroVol || "—"}{" "}
                    {traveler.flightTime ? `· ${traveler.flightTime}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-mute">
                    {t("pay.visa")}
                  </p>
                  <p
                    className={`mt-0.5 text-ink ${
                      traveler.statutVisa === "need" ? "text-gold2" : ""
                    }`}
                  >
                    {visaMap[traveler.statutVisa] ?? visaMap.ok}
                  </p>
                </div>
              </div>
            </div>

            {/* Total recap */}
            <div className="mt-6 bg-cream2 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2 text-[13px] text-mute">
                <span>{t("subtotal")}</span>
                <span className="mono">{fmt(subtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between mb-2 text-[13px] text-mute">
                <span>{t("vat")}</span>
                <span className="mono">{fmt(tva, currency)}</span>
              </div>
              <div className="flex items-center justify-between mb-3 text-[13px] text-mute">
                <span>{t("fee")}</span>
                <span className="mono">{fmt(fee, currency)}</span>
              </div>
              <div className="border-t border-line pt-3 flex items-end justify-between">
                <span className="text-[11px] uppercase tracking-wider text-mute">{t("total_ttc")}</span>
                <span className="figure text-[28px] text-ink">{fmt(totalTTC, currency)}</span>
              </div>
            </div>

            {/* CGV */}
            <label className="mt-5 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cgvChecked}
                onChange={(e) => setCgvChecked(e.target.checked)}
                className="accent-gold w-4 h-4 mt-1"
              />
              <span className="text-[12px] text-mute leading-snug">
                {t.rich("cgv", {
                  link: (chunks) => (
                    <a className="text-ink underline" href="/fr/cgu">
                      {chunks}
                    </a>
                  ),
                })}
              </span>
            </label>

            {payError && (
              <div className="mt-3 bg-err/10 border border-err/20 text-err rounded-xl px-4 py-3 text-[13px]">
                {payError}
              </div>
            )}

            {/* GeniusPay payment */}
            <div className="mt-5">
              <PaymentButton
                amount={totalTTC}
                currency={currency as "XOF" | "EUR" | "USD"}
                description={`Reservation AIKO — ${traveler.prenom} ${traveler.nom}`}
                customerName={`${traveler.prenom} ${traveler.nom}`}
                customerEmail={traveler.email}
                customerPhone={`${traveler.indicatif}${traveler.telephone}`}
                type="reservation"
                onBeforePay={async () => {
                  const cartLignes: { serviceId: string; tarifId?: string; quantite: number }[] = [];
                  for (const [id, q] of Object.entries(cart.transport)) {
                    cartLignes.push({ serviceId: id, quantite: q });
                  }
                  if (cart.hotel) {
                    cartLignes.push({ serviceId: cart.hotel.id, quantite: cart.hotel.nights });
                  }
                  for (const id of Object.keys(cart.meals)) {
                    cartLignes.push({ serviceId: id, quantite: cart.pax * (cart.hotel ? cart.hotel.nights : 1) });
                  }
                  const extrasArr = cart.extras instanceof Set ? Array.from(cart.extras) : [];
                  for (const id of extrasArr) {
                    cartLignes.push({ serviceId: id, quantite: 1 });
                  }
                  if (cartLignes.length === 0) return;

                  try {
                    const res = await fetch("/api/commandes", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        voyageur: {
                          prenom: traveler.prenom,
                          nom: traveler.nom,
                          email: traveler.email,
                          telephone: `${traveler.indicatif}${traveler.telephone}`,
                          nationalite: traveler.nationalite,
                          dateArrivee: traveler.dateArrivee,
                          dateDepart: traveler.dateDepart,
                          nombrePersonnes: traveler.nombrePersonnes,
                          compagnie: traveler.compagnie || undefined,
                          numeroVol: traveler.numeroVol || undefined,
                          heureArrivee: traveler.flightTime || undefined,
                          aeroport: traveler.aeroport || undefined,
                          passeport: traveler.passeport || undefined,
                          typeVisa: traveler.typeVisa || undefined,
                          statutVisa: traveler.statutVisa || undefined,
                          notes: traveler.notes || undefined,
                        },
                        lignes: cartLignes,
                        devise: currency,
                        langue: "fr",
                      }),
                    });
                    const data = await res.json();
                    if (data.reference) {
                      return { participantRef: data.reference };
                    }
                  } catch {
                    // continue to payment
                  }
                  return {};
                }}
                onError={setPayError}
                disabled={!cgvChecked || isEmpty}
                label={`Payer ${fmt(totalTTC, currency)} via GeniusPay`}
              />
            </div>

            {/* Security badges */}
            <div className="hr my-5" />
            <div className="flex items-center justify-center gap-4 text-[11px] text-mute">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-ok" />
                <span>{t("secure")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
