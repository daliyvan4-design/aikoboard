"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ExternalLink, Images, MapPin, X } from "lucide-react";

/**
 * Choix d'un hébergement parmi ceux que l'événement propose.
 *
 * Les résidences viennent du parc réel géré dans /admin/residences : mêmes
 * photos, mêmes chambres, mêmes prix. Le dépliant ne montre qu'une ligne
 * par résidence — avec dix-huit adresses au catalogue, tout déplier
 * rendrait le formulaire interminable. La fiche complète du choix courant
 * s'affiche en dessous, et « Plus de résidences » ouvre le catalogue
 * entier dans un nouvel onglet, sans faire perdre le formulaire en cours.
 */

export interface PickerResidenceTarif {
  id: string;
  label: string;
  typeChambre: string;
  prixParNuit: number;
  devise: string;
  capacite: number;
}

export interface PickerResidence {
  id: string;
  nom: string;
  type: string;
  description?: string | null;
  adresse?: string;
  ville: string;
  quartier?: string | null;
  capacite?: number;
  equipements?: string | null;
  images: { id: string; url: string; legende: string | null }[];
  tarifs: PickerResidenceTarif[];
}

interface Props {
  residences: PickerResidence[];
  residenceId: string | null;
  tarifId: string | null;
  onChange: (residenceId: string | null, tarifId: string | null) => void;
  /** Catalogue complet, ouvert dans un nouvel onglet */
  moreHref: string;
  /** Fiche detaillee d'une residence */
  detailHref: (id: string) => string;
  labels?: Partial<typeof DEFAULT_LABELS>;
}

const DEFAULT_LABELS = {
  none: "Aucun hébergement",
  from: "à partir de",
  onRequest: "prix sur demande",
  perNight: "/ nuit",
  room: "Chambre",
  roomNone: "Tarif communiqué par l'équipe",
  more: "Plus de résidences",
  sheet: "Voir la fiche",
  photos: "photos",
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function minPrice(r: PickerResidence): number | null {
  return r.tarifs.length > 0 ? Math.min(...r.tarifs.map((t) => t.prixParNuit)) : null;
}

/** Visionneuse plein ecran : les photos sont l'argument de vente. */
function Lightbox({
  images,
  index,
  onClose,
  onMove,
}: {
  images: PickerResidence["images"];
  index: number;
  onClose: () => void;
  onMove: (next: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onMove((index + 1) % images.length);
      if (e.key === "ArrowLeft") onMove((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onMove]);

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/95 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 w-10 h-10 rounded-full bg-cream/10 text-cream flex items-center justify-center"
        aria-label="Fermer"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative w-full max-w-4xl aspect-[4/3]" onClick={(e) => e.stopPropagation()}>
        <Image
          src={images[index].url}
          alt={images[index].legende ?? ""}
          fill
          className="object-contain"
          sizes="100vw"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => onMove((index - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-ink/70 text-cream flex items-center justify-center"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onMove((index + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-ink/70 text-cream flex items-center justify-center"
              aria-label="Photo suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[12px] text-cream/70 bg-ink/70 rounded-full px-3 py-1">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function ResidencePicker({
  residences,
  residenceId,
  tarifId,
  onChange,
  moreHref,
  detailHref,
  labels,
}: Props) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const [zoom, setZoom] = useState<number | null>(null);

  const choisie = residences.find((r) => r.id === residenceId) ?? null;

  if (residences.length === 0) return null;

  return (
    <div className="space-y-3 min-w-0">
      <select
        value={residenceId ?? ""}
        onChange={(e) => {
          const suivante = residences.find((r) => r.id === e.target.value) ?? null;
          // La chambre appartient a la residence : changer d'adresse
          // repart du tarif le moins cher, jamais de celui d'a cote.
          onChange(suivante?.id ?? null, suivante?.tarifs[0]?.id ?? null);
        }}
        className="w-full min-w-0 bg-cream2 border border-line rounded-xl px-4 py-3 text-[15px]"
      >
        <option value="">{l.none}</option>
        {residences.map((r) => {
          const prix = minPrice(r);
          return (
            <option key={r.id} value={r.id}>
              {r.nom}
              {r.quartier ? ` · ${r.quartier}` : ""} —{" "}
              {prix ? `${l.from} ${formatPrice(prix)} XOF ${l.perNight}` : l.onRequest}
            </option>
          );
        })}
      </select>

      {choisie && (
        <div className="border border-gold/40 bg-gold/[0.04] rounded-xl p-3 animate-fade-up min-w-0">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <p className="text-[14px] text-ink font-medium truncate">{choisie.nom}</p>
              <p className="text-[12px] text-mute flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {choisie.quartier ? `${choisie.quartier}, ` : ""}
                  {choisie.ville}
                </span>
              </p>
            </div>
            <a
              href={detailHref(choisie.id)}
              target="_blank"
              rel="noreferrer"
              className="text-[12px] text-gold hover:underline flex items-center gap-1 shrink-0"
            >
              {l.sheet}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Bande de photos : cliquer ouvre la visionneuse */}
          {choisie.images.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {choisie.images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setZoom(i)}
                  className="relative h-16 w-24 shrink-0 rounded-lg overflow-hidden border border-line"
                  aria-label={`${l.photos} ${i + 1}`}
                >
                  <Image
                    src={img.url}
                    alt={img.legende ?? ""}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Chambre : c'est elle qui porte le prix */}
          {choisie.tarifs.length > 0 ? (
            <div className="mt-3">
              <label className="block text-[11px] uppercase tracking-wider text-mute mb-1">
                {l.room}
              </label>
              <select
                value={tarifId ?? ""}
                onChange={(e) => onChange(choisie.id, e.target.value || null)}
                className="w-full min-w-0 bg-white border border-line rounded-xl px-3 py-2.5 text-[14px]"
              >
                {choisie.tarifs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} · {t.typeChambre} · {t.capacite} pers. —{" "}
                    {formatPrice(t.prixParNuit)} {t.devise} {l.perNight}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="mt-3 text-[12px] text-mute">{l.roomNone}</p>
          )}
        </div>
      )}

      <a
        href={moreHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-[13px] text-ink border border-line rounded-full px-4 py-2 hover:border-gold/50 transition-colors"
      >
        <Images className="w-3.5 h-3.5 text-gold" />
        {l.more}
        <ExternalLink className="w-3 h-3 text-mute" />
      </a>

      {zoom !== null && choisie && choisie.images.length > 0 && (
        <Lightbox
          images={choisie.images}
          index={zoom}
          onClose={() => setZoom(null)}
          onMove={setZoom}
        />
      )}
    </div>
  );
}
