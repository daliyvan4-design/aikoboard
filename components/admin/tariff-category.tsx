"use client";

import { Plus } from "lucide-react";
import { TariffRow } from "./tariff-row";
import { Car, CarFront, BedDouble, Utensils, Sparkles, type LucideIcon } from "lucide-react";
import { RATE } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  vehicule: Car,
  transport: CarFront,
  hebergement: BedDouble,
  repas: Utensils,
  extras: Sparkles,
};

const LABELS: Record<string, string> = {
  vehicule: "Véhicules avec chauffeur",
  transport: "Transport & accueil",
  hebergement: "Hébergement",
  repas: "Repas",
  extras: "Extras",
};

interface Service {
  id: string;
  nom: string;
  actif: boolean;
  /** Prix affiche au participant quand le service n'a pas de tarif detaille */
  prixBase: number;
  unite: string;
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
  onPrixBaseChange: (serviceId: string, prix: number) => void;
}

export function TariffCategory({
  categorie,
  services,
  onLabelChange,
  onPriceChange,
  onToggleVisible,
  onDeleteTarif,
  onAddTarif,
  onPrixBaseChange,
}: TariffCategoryProps) {
  const Icon = ICONS[categorie] || Sparkles;
  const label = LABELS[categorie] || categorie;
  const tarifCount = services.reduce((s, svc) => s + Math.max(1, svc.tarifs.length), 0);

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
              svc.tarifs.length > 0
                ? svc.tarifs.map((t) => (
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
                : [
                    // Sans tarif detaille, c'est le prix de reference du
                    // service que voit le participant : il s'edite ici.
                    <tr key={svc.id} className="group">
                      <td className="px-5 py-3 text-ink">
                        {svc.nom}
                        <span className="text-mute text-[11px]"> · prix de r{"é"}f{"é"}rence / {svc.unite}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <input
                          defaultValue={Math.round(svc.prixBase).toLocaleString("fr-FR").replace(/,/g, " ")}
                          onBlur={(e) => {
                            const v = parseInt(e.target.value.replace(/\D/g, "")) || 0;
                            if (v !== Math.round(svc.prixBase)) onPrixBaseChange(svc.id, v);
                          }}
                          className="bg-transparent text-right mono w-28 focus:bg-cream rounded px-2 py-1 text-ink font-semibold"
                        />
                      </td>
                      <td className="px-5 py-3 text-right mono text-mute">
                        {Math.round(svc.prixBase * RATE.EUR)} {"€"}
                      </td>
                      <td className="px-5 py-3 text-right mono text-mute">
                        ${Math.round(svc.prixBase * RATE.USD)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => onToggleVisible(svc.id, !svc.actif)}
                          className={`relative w-[42px] h-6 rounded-full transition-colors cursor-pointer inline-block align-middle ${
                            svc.actif ? "bg-ink" : "bg-line"
                          }`}
                        >
                          <span
                            className={`absolute top-[2px] w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                              svc.actif ? "left-5" : "left-[2px]"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-5 py-3" />
                    </tr>,
                  ],
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
