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
}

const CATEGORY_LABELS: Record<string, string> = {
  transport: "Transport",
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
}

export function ServicePicker({
  catalog = false,
  services,
  selected,
  onChange,
  showPrices = true,
  emptyLabel = "Aucun service disponible",
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

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
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
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {list.map((s) => {
              const active = selected.includes(s.id);
              return (
                <label
                  key={s.id}
                  className={`flex items-start gap-3 cursor-pointer border rounded-xl p-3 transition-all min-w-0 ${
                    active ? "border-gold bg-gold/5" : "border-line bg-cream2"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggle(s.id)}
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
        </div>
      ))}
    </div>
  );
}
