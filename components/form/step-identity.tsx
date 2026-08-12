"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, AtSign, ChevronDown, Lock, Info, Minus, Plus } from "lucide-react";
import { MiniCalendar } from "./mini-calendar";
import type { TravelerData } from "./wizard-shell";

interface StepIdentityProps {
  data: TravelerData;
  onChange: (data: TravelerData) => void;
  typeReservation: "NORMALE" | "INSTITUTIONNELLE";
  onTypeChange: (t: "NORMALE" | "INSTITUTIONNELLE") => void;
  onNext: () => void;
}

function update<K extends keyof TravelerData>(
  data: TravelerData,
  key: K,
  value: TravelerData[K],
  onChange: (d: TravelerData) => void,
) {
  onChange({ ...data, [key]: value });
}

export function StepIdentity({ data, onChange, typeReservation, onTypeChange, onNext }: StepIdentityProps) {
  const t = useTranslations("s2");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const bumpPax = (delta: number) => {
    const next = data.nombrePersonnes + delta;
    if (next >= 1 && next <= 20) {
      update(data, "nombrePersonnes", next, onChange);
    }
  };

  return (
    <section>
      <div className="max-w-5xl mx-auto px-5 lg:px-8 pt-10 pb-24">
        {/* Step header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              className="text-[13px] text-mute hover:text-ink flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4 flip-rtl" />
              <span>{t("back")}</span>
            </button>
            <span className="text-[11px] uppercase tracking-[0.22em] text-mute">
              {t("step")}
            </span>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold bg-ink text-gold">
              1
            </span>
            <span className="hr flex-1 bg-ink/30 h-px" />
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold bg-cream2 text-ink/40 border border-line">
              2
            </span>
            <span className="hr flex-1 bg-ink/10 h-px" />
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold bg-cream2 text-ink/40 border border-line">
              3
            </span>
          </div>

          <h2 className="font-serif text-[32px] sm:text-[40px] text-ink mt-6">
            {t("title")}
          </h2>
          <p className="text-mute mt-1 max-w-xl text-[15px]">{t("lead")}</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl border border-line shadow-card p-6 sm:p-10">
          <form
            onSubmit={handleSubmit}
            className="grid md:grid-cols-2 gap-x-8 gap-y-6"
          >
            {/* ── Type de réservation ── */}
            <div className="md:col-span-2 mb-2">
              <label className="block text-[12px] font-medium text-ink mb-3 uppercase tracking-wider">
                Type de réservation
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onTypeChange("NORMALE")}
                  className={`flex-1 rounded-xl border px-5 py-3.5 text-[14px] font-medium transition-all ${
                    typeReservation === "NORMALE"
                      ? "border-gold bg-gold/10 text-ink"
                      : "border-line bg-white text-mute hover:border-gold/40"
                  }`}
                >
                  <span className="block text-[15px]">Normale</span>
                  <span className="block text-[11px] text-mute mt-0.5">Réservation standard</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTypeChange("INSTITUTIONNELLE")}
                  className={`flex-1 rounded-xl border px-5 py-3.5 text-[14px] font-medium transition-all ${
                    typeReservation === "INSTITUTIONNELLE"
                      ? "border-gold bg-gold/10 text-ink"
                      : "border-line bg-white text-mute hover:border-gold/40"
                  }`}
                >
                  <span className="block text-[15px]">Institutionnelle</span>
                  <span className="block text-[11px] text-mute mt-0.5">VIP · Délégation d&apos;État</span>
                </button>
              </div>
            </div>

            {/* ── Section 01 — Identité ── */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] uppercase tracking-[0.28em] text-gold">
                  01
                </span>
                <h3 className="font-serif text-[20px] text-ink leading-none">
                  {t("sec.identity")}
                </h3>
                <span className="hr flex-1 mt-1" />
              </div>
            </div>

            {/* Prénom */}
            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                {t("f.first")}
              </label>
              <input
                required
                name="first"
                placeholder={t("ph.first")}
                value={data.prenom}
                onChange={(e) => update(data, "prenom", e.target.value, onChange)}
                className="w-full bg-cream border border-line rounded-xl px-4 py-3.5 text-[15px]"
              />
            </div>

            {/* Nom */}
            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                {t("f.last")}
              </label>
              <input
                required
                name="last"
                placeholder={t("ph.last")}
                value={data.nom}
                onChange={(e) => update(data, "nom", e.target.value, onChange)}
                className="w-full bg-cream border border-line rounded-xl px-4 py-3.5 text-[15px]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                {t("f.email")}
              </label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
                <input
                  required
                  type="email"
                  name="email"
                  placeholder={t("ph.email")}
                  value={data.email}
                  onChange={(e) => update(data, "email", e.target.value, onChange)}
                  className="w-full bg-cream border border-line rounded-xl pl-10 pr-4 py-3.5 text-[15px]"
                />
              </div>
            </div>

            {/* Telephone */}
            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                {t("f.phone")}
              </label>
              <div className="flex gap-2">
                <select
                  value={data.indicatif}
                  onChange={(e) =>
                    update(data, "indicatif", e.target.value, onChange)
                  }
                  className="bg-cream border border-line rounded-xl px-3 py-3.5 text-[15px] mono w-28"
                >
                  <option value="+225">{"\u{1F1E8}\u{1F1EE}"} +225</option>
                  <option value="+33">{"\u{1F1EB}\u{1F1F7}"} +33</option>
                  <option value="+221">{"\u{1F1F8}\u{1F1F3}"} +221</option>
                  <option value="+212">{"\u{1F1F2}\u{1F1E6}"} +212</option>
                  <option value="+213">{"\u{1F1E9}\u{1F1FF}"} +213</option>
                  <option value="+971">{"\u{1F1E6}\u{1F1EA}"} +971</option>
                  <option value="+44">{"\u{1F1EC}\u{1F1E7}"} +44</option>
                </select>
                <input
                  required
                  name="phone"
                  placeholder={t("ph.phone")}
                  value={data.telephone}
                  onChange={(e) =>
                    update(data, "telephone", e.target.value, onChange)
                  }
                  className="flex-1 bg-cream border border-line rounded-xl px-4 py-3.5 text-[15px] mono"
                />
              </div>
            </div>

            {/* Nationalité */}
            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                {t("f.nat")}
              </label>
              <div className="relative">
                <select
                  value={data.nationalite}
                  onChange={(e) =>
                    update(data, "nationalite", e.target.value, onChange)
                  }
                  className="w-full appearance-none bg-cream border border-line rounded-xl px-4 py-3.5 text-[15px] pr-10"
                >
                  <option>{"\u{1F1E8}\u{1F1EE}"} Ivoirienne</option>
                  <option>{"\u{1F1EB}\u{1F1F7}"} Française</option>
                  <option>{"\u{1F1F2}\u{1F1E6}"} Marocaine</option>
                  <option>{"\u{1F1F8}\u{1F1F3}"} Sénégalaise</option>
                  <option>{"\u{1F1E9}\u{1F1FF}"} Algérienne</option>
                  <option>{"\u{1F1E8}\u{1F1E6}"} Canadienne</option>
                  <option>{"\u{1F1E6}\u{1F1EA}"} Émirienne</option>
                  <option>{"\u{1F1EC}\u{1F1E7}"} Britannique</option>
                  <option>{"\u{1F1FA}\u{1F1F8}"} Américaine</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute pointer-events-none" />
              </div>
            </div>

            {/* Nombre de personnes (pax stepper) */}
            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                {t("f.pax")}
              </label>
              <div className="flex items-center justify-between bg-cream border border-line rounded-xl px-4 py-2.5">
                <span className="text-[15px]">{t("f.pax_short")}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => bumpPax(-1)}
                    className="w-7 h-7 rounded-full border border-line flex items-center justify-center text-mute hover:text-ink hover:border-ink/30 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="figure text-[16px] w-5 text-center">
                    {data.nombrePersonnes}
                  </span>
                  <button
                    type="button"
                    onClick={() => bumpPax(1)}
                    className="w-7 h-7 rounded-full border border-line flex items-center justify-center text-mute hover:text-ink hover:border-ink/30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dates de séjour */}
            <div className="md:col-span-2">
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                {t("f.dates")}
              </label>
              <div className="bg-cream border border-line rounded-xl p-4 sm:p-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Selected dates summary */}
                  <div className="flex items-center gap-5">
                    <div className="flex-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-mute">
                        {t("arrival")}
                      </p>
                      <p className="figure text-[22px] text-ink mt-1">
                        {t("arr_date")}
                      </p>
                      <p className="text-[12px] text-mute">{t("arr_sub")}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-mute flip-rtl" />
                    <div className="flex-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-mute">
                        {t("departure")}
                      </p>
                      <p className="figure text-[22px] text-ink mt-1">
                        {t("dep_date")}
                      </p>
                      <p className="text-[12px] text-mute">{t("dep_sub")}</p>
                    </div>
                  </div>

                  {/* Mini calendar */}
                  <MiniCalendar startDay={12} endDay={16} />
                </div>
              </div>
            </div>

            {/* ── Section 02 — Vol d'arrivée ── */}
            <div className="md:col-span-2 pt-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] uppercase tracking-[0.28em] text-gold">
                  02
                </span>
                <h3 className="font-serif text-[20px] text-ink leading-none">
                  {t("sec.flight")}
                </h3>
                <span className="hr flex-1 mt-1" />
              </div>
            </div>

            {/* Compagnie aérienne */}
            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                {t("f.airline")}
              </label>
              <input
                name="airline"
                placeholder={t("ph.airline")}
                value={data.compagnie}
                onChange={(e) =>
                  update(data, "compagnie", e.target.value, onChange)
                }
                className="w-full bg-cream border border-line rounded-xl px-4 py-3.5 text-[15px]"
              />
            </div>

            {/* N° de vol */}
            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                {t("f.flightNo")}
              </label>
              <input
                name="flightNo"
                placeholder={t("ph.flightNo")}
                value={data.numeroVol}
                onChange={(e) =>
                  update(data, "numeroVol", e.target.value, onChange)
                }
                className="w-full bg-cream border border-line rounded-xl px-4 py-3.5 text-[15px] mono uppercase tracking-wider"
              />
            </div>

            {/* Date & heure d'arrivée */}
            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                {t("f.flightAt")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  name="flightDate"
                  value={data.flightDate}
                  onChange={(e) =>
                    update(data, "flightDate", e.target.value, onChange)
                  }
                  className="bg-cream border border-line rounded-xl px-4 py-3.5 text-[15px] mono"
                />
                <input
                  type="time"
                  name="flightTime"
                  value={data.flightTime}
                  onChange={(e) =>
                    update(data, "flightTime", e.target.value, onChange)
                  }
                  className="bg-cream border border-line rounded-xl px-4 py-3.5 text-[15px] mono"
                />
              </div>
            </div>

            {/* Aéroport d'arrivée */}
            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                {t("f.airport")}
              </label>
              <div className="relative">
                <select
                  name="airport"
                  value={data.aeroport}
                  onChange={(e) =>
                    update(data, "aeroport", e.target.value, onChange)
                  }
                  className="w-full appearance-none bg-cream border border-line rounded-xl px-4 py-3.5 text-[15px] pr-10"
                >
                  <option value="FHB">{t("airport.fhb")}</option>
                  <option value="ASK">{t("airport.ask")}</option>
                  <option value="other">{t("airport.other")}</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute pointer-events-none" />
              </div>
            </div>

            {/* ── Section 03 — Passeport & visa ── */}
            <div className="md:col-span-2 pt-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] uppercase tracking-[0.28em] text-gold">
                  03
                </span>
                <h3 className="font-serif text-[20px] text-ink leading-none">
                  {t("sec.visa")}
                </h3>
                <span className="hr flex-1 mt-1" />
              </div>
            </div>

            {/* N° de passeport */}
            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                {t("f.passport")}
              </label>
              <input
                name="passport"
                placeholder={t("ph.passport")}
                value={data.passeport}
                onChange={(e) =>
                  update(data, "passeport", e.target.value, onChange)
                }
                className="w-full bg-cream border border-line rounded-xl px-4 py-3.5 text-[15px] mono uppercase tracking-wider"
              />
            </div>

            {/* Type de visa */}
            <div>
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                {t("f.visaType")}
              </label>
              <div className="relative">
                <select
                  name="visaType"
                  value={data.typeVisa}
                  onChange={(e) =>
                    update(data, "typeVisa", e.target.value, onChange)
                  }
                  className="w-full appearance-none bg-cream border border-line rounded-xl px-4 py-3.5 text-[15px] pr-10"
                >
                  <option>{t("visaType.biz")}</option>
                  <option>{t("visaType.tour")}</option>
                  <option>{t("visaType.dip")}</option>
                  <option>{t("visaType.evisa")}</option>
                  <option>{t("visaType.exempt")}</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute pointer-events-none" />
              </div>
            </div>

            {/* Statut du visa */}
            <div className="md:col-span-2">
              <label className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
                {t("f.visaState")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="bg-cream border border-line rounded-xl px-4 py-3.5 text-[14px] cursor-pointer flex items-center gap-3">
                  <input
                    type="radio"
                    name="visaState"
                    value="ok"
                    checked={data.statutVisa === "ok"}
                    onChange={(e) =>
                      update(data, "statutVisa", e.target.value, onChange)
                    }
                    className="accent-gold"
                  />
                  <span>{t("visa.ok")}</span>
                </label>
                <label className="bg-cream border border-line rounded-xl px-4 py-3.5 text-[14px] cursor-pointer flex items-center gap-3">
                  <input
                    type="radio"
                    name="visaState"
                    value="pending"
                    checked={data.statutVisa === "pending"}
                    onChange={(e) =>
                      update(data, "statutVisa", e.target.value, onChange)
                    }
                    className="accent-gold"
                  />
                  <span>{t("visa.pending")}</span>
                </label>
                <label className="bg-cream border border-line rounded-xl px-4 py-3.5 text-[14px] cursor-pointer flex items-center gap-3">
                  <input
                    type="radio"
                    name="visaState"
                    value="need"
                    checked={data.statutVisa === "need"}
                    onChange={(e) =>
                      update(data, "statutVisa", e.target.value, onChange)
                    }
                    className="accent-gold"
                  />
                  <span>{t("visa.need")}</span>
                </label>
              </div>
              <p className="text-[11px] text-mute mt-2 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span
                  dangerouslySetInnerHTML={{
                    __html: t.raw("visa.info").replace(
                      /<bold>(.*?)<\/bold>/g,
                      '<span class="text-ink">$1</span>'
                    ),
                  }}
                />
              </p>
            </div>

            {/* ── Section 04 — Demandes particulières ── */}
            <div className="md:col-span-2 pt-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] uppercase tracking-[0.28em] text-gold">
                  04
                </span>
                <h3 className="font-serif text-[20px] text-ink leading-none">
                  <span>{t("sec.notes")}</span>{" "}
                  <span className="text-mute text-[13px] tracking-normal">
                    {t("sec.notes_opt")}
                  </span>
                </h3>
                <span className="hr flex-1 mt-1" />
              </div>
              <textarea
                name="notes"
                rows={3}
                placeholder={t("ph.notes")}
                value={data.notes}
                onChange={(e) =>
                  update(data, "notes", e.target.value, onChange)
                }
                className="w-full bg-cream border border-line rounded-xl px-4 py-3 text-[15px]"
              />
            </div>

            {/* Submit row */}
            <div className="md:col-span-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
              <p className="text-[12px] text-mute flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>{t("gdpr")}</span>
              </p>
              <button
                type="submit"
                className="btn-press inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-7 py-4 text-[15px] font-semibold w-full sm:w-auto"
              >
                <span>{t("submit")}</span>
                <ArrowRight className="w-4 h-4 flip-rtl" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
