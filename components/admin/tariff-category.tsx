"use client";

import { Plus } from "lucide-react";
import { TariffRow } from "./tariff-row";
import { CarFront, BedDouble, Utensils, Sparkles } from "lucide-react";

const ICONS: Record<string, any> = {
  transport: CarFront,
  hebergement: BedDouble,
  repas: Utensils,
  extras: Sparkles,
};

const LABELS: Record<string, string> = {
  transport: "Transport",
  hebergement: "Hébergement",
  repas: "Repas",
  extras: "Extras",
};

interface Service {
  id: string;
  nom: string;
  actif: boolean;
  tarifs: { id: string; label: string; prix: number }[];
}

interface TariffCategoryProps {
  categorie: string;
  services: Service[];
  onLabelChange: (tarifId: string, label: string) => void;
  onPriceChange: (tarifId: string, prix: number) => void;
  onToggleVisible: (serviceId: string, actif: boolean) => void;
  onDeleteTarif: (tarifId: string) => void;
  onAddTarif: (serviceId: string) => void;
}

export function TariffCategory({
  categorie,
  services,
  onLabelChange,
  onPriceChange,
  onToggleVisible,
  onDeleteTarif,
  onAddTarif,
}: TariffCategoryProps) {
  const Icon = ICONS[categorie] || Sparkles;
  const label = LABELS[categorie] || categorie;
  const tarifCount = services.reduce((s, svc) => s + svc.tarifs.length, 0);

  return (
    <div className="bg-white rounded-2xl border border-line overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-cream/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-ink text-gold flex items-center justify-center">
            <Icon size={18} />
          </div>
          <div>
            <p className="font-serif text-[18px] text-ink">{label}</p>
            <p className="text-[11px] text-mute">{tarifCount} tarifs</p>
          </div>
        </div>
        <button
          onClick={() => services[0] && onAddTarif(services[0].id)}
          className="text-[12px] bg-cream border border-line rounded-full px-3 py-1.5 flex items-center gap-1.5 hover:border-ink/30"
        >
          <Plus size={12} /> Ajouter un tarif
        </button>
      </div>
      {/* Un tableau large scrolle dans sa carte au lieu de pousser toute la page. */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="text-[10px] uppercase tracking-[0.18em] text-mute">
            <tr className="border-t border-line">
              <th className="text-left font-medium px-5 py-3 w-2/5">Service</th>
              <th className="text-right font-medium px-5 py-3">Prix XOF</th>
              <th className="text-right font-medium px-5 py-3">Prix EUR</th>
              <th className="text-right font-medium px-5 py-3">Prix USD</th>
              <th className="text-right font-medium px-5 py-3 w-32">Visible</th>
              <th className="px-5 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {services.flatMap((svc) =>
              svc.tarifs.map((t) => (
                <TariffRow
                  key={t.id}
                  tarif={t}
                  serviceActif={svc.actif}
                  onLabelChange={onLabelChange}
                  onPriceChange={onPriceChange}
                  onToggleVisible={(v) => onToggleVisible(svc.id, v)}
                  onDelete={onDeleteTarif}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
