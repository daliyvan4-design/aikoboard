"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Selection de services de conciergerie, partagee par deux ecrans :
 *  - la creation d'evenement, ou l'organisateur compose le pack a partir
 *    du catalogue complet ;
 *  - l'inscription, ou le participant coche ce qu'il veut parmi ce pack.
 *
 * Meme composant, deux sources : `catalog` charge tout le catalogue,
 * `services` recoit une liste deja filtree.
 */

export interface PickerService {
  id: string;
  nom: string;
  description?: string | null;
  categorie: string;
  prixBase: number;
  unite: string;
  /** Renseignes pour l'hebergement : etoiles, quartier, mention */
  etoiles?: number | null;
  quartier?: string | null;
  badge?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  vehicule: "Véhicule avec chauffeur",
  transport: "Transport & accueil",
  hebergement: "Hébergement",
  repas: "Restauration",
  extras: "Extras & conciergerie",
};

function formatPrice(prix: number, unite: string): string {
  if (prix <= 0) return "Inclus";
  return `${new Intl.NumberFormat("fr-FR").format(prix)} XOF / ${unite}`;
}

interface Props {
  /** Charge le catalogue complet depuis /api/services */
  catalog?: boolean;
  /** Liste imposee (pack d'un evenement) */
  services?: PickerService[];
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Affiche le prix indicatif a cote de chaque service */
  showPrices?: boolean;
  emptyLabel?: string;
  /**
   * Categories ou un seul service peut etre retenu. Personne ne dort dans
   * deux hotels a la fois : cocher un hebergement remplace le precedent.
   * Ne s'applique pas cote organisateur, qui en propose plusieurs.
   */
  exclusiveCategories?: string[];
}

export function ServicePicker({
  catalog = false,
  services,
  selected,
  onChange,
  showPrices = true,
  emptyLabel = "Aucun service disponible",
  exclusiveCategories = [],
}: Props) {
  const [fetched, setFetched] = useState<PickerService[]>([]);
  const [loading, setLoading] = useState(catalog);

  // En mode liste imposee, rien a stocker : la valeur vient des props.
  const loaded = catalog ? fetched : services ?? [];

  useEffect(() => {
    if (!catalog) return;
    let cancelled = false;
    fetch("/api/services")
      .then((r) => r.json())
      .then((grouped: Record<string, PickerService[]>) => {
        if (cancelled) return;
        // L'API renvoie les services groupes par categorie
        setFetched(Object.values(grouped ?? {}).flat());
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [catalog]);

  const toggle = (service: PickerService) => {
    const { id, categorie } = service;

    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
      return;
    }

    if (exclusiveCategories.includes(categorie)) {
      // On retire les autres choix de la meme categorie avant d'ajouter
      const concurrents = new Set(
        loaded.filter((s) => s.categorie === categorie).map((s) => s.id),
      );
      onChange([...selected.filter((s) => !concurrents.has(s)), id]);
      return;
    }

    onChange([...selected, id]);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-mute py-4">
        <Loader2 className="w-4 h-4 animate-spin text-gold" />
        Chargement des services…
      </div>
    );
  }

  if (loaded.length === 0) {
    return <p className="text-[13px] text-mute py-2">{emptyLabel}</p>;
  }

  const byCategory = loaded.reduce<Record<string, PickerService[]>>((acc, s) => {
    (acc[s.categorie] = acc[s.categorie] ?? []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {Object.entries(byCategory).map(([categorie, list]) => (
        <div key={categorie}>
          <p className="text-[11px] uppercase tracking-wider text-mute mb-2">
            {CATEGORY_LABELS[categorie] ?? categorie}
            {exclusiveCategories.includes(categorie) && (
              <span className="normal-case tracking-normal text-mute/60"> · un seul choix</span>
            )}
          </p>
          {categorie === "hebergement" ? (
            <div className="space-y-3">
              {/* Choix rapide : une seule ligne, comme pour les pays */}
              <select
                value={list.find((h) => selected.includes(h.id))?.id ?? ""}
                onChange={(e) => {
                  const choisi = list.find((h) => h.id === e.target.value);
                  const autres = new Set(list.map((h) => h.id));
                  const reste = selected.filter((id) => !autres.has(id));
                  onChange(choisi ? [...reste, choisi.id] : reste);
                }}
                className="w-full min-w-0 bg-cream2 border border-line rounded-xl px-4 py-3 text-[15px]"
              >
                <option value="">Aucun hébergement</option>
                {list.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nom} — {new Intl.NumberFormat("fr-FR").format(h.prixBase)} XOF / nuit
                    {h.etoiles ? ` · ${h.etoiles}★` : ""}
                  </option>
                ))}
              </select>

              {/* Fiches completes : l'utilisateur voit tout ce qui existe */}
              <div className="grid sm:grid-cols-2 gap-2">
                {list.map((h) => {
                  const actif = selected.includes(h.id);
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => toggle(h)}
                      className={`text-left border rounded-xl p-3 transition-all min-w-0 ${
                        actif ? "border-gold bg-gold/5 ring-1 ring-gold/30" : "border-line bg-cream2 hover:border-gold/40"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-[13px] text-ink font-medium min-w-0">{h.nom}</span>
                        {h.etoiles ? (
                          <span className="text-[11px] text-gold shrink-0">{"★".repeat(h.etoiles)}</span>
                        ) : null}
                      </span>
                      {h.quartier || h.badge ? (
                        <span className="block text-[11px] text-mute mt-0.5">
                          {[h.quartier, h.badge].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                      {h.description ? (
                        <span className="block text-[11px] text-mute/80 mt-1 leading-snug">{h.description}</span>
                      ) : null}
                      <span className="block text-[13px] text-gold font-semibold mt-1.5">
                        {new Intl.NumberFormat("fr-FR").format(h.prixBase)} XOF
                        <span className="text-[11px] text-mute font-normal"> / nuit</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {list.map((s) => {
              const active = selected.includes(s.id);
              const exclusive = exclusiveCategories.includes(categorie);
              return (
                <label
                  key={s.id}
                  className={`flex items-start gap-3 cursor-pointer border rounded-xl p-3 transition-all min-w-0 ${
                    active ? "border-gold bg-gold/5" : "border-line bg-cream2"
                  }`}
                >
                  <input
                    type={exclusive ? "radio" : "checkbox"}
                    name={exclusive ? `service-${categorie}` : undefined}
                    checked={active}
                    // Un radio deja coche ne declenche pas onChange : le clic
                    // sert aussi a le decocher, pour ne rien demander du tout.
                    onChange={() => toggle(s)}
                    onClick={() => { if (exclusive && active) toggle(s); }}
                    className="accent-gold w-4 h-4 mt-0.5 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] text-ink font-medium">{s.nom}</span>
                    {showPrices && (
                      <span className="block text-[11px] text-mute mt-0.5">
                        {formatPrice(s.prixBase, s.unite)}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          )}
        </div>
      ))}
    </div>
  );
}
