"use client";

import { Eye, MoreHorizontal } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { fmt } from "@/lib/utils";

interface Order {
  id: string;
  reference: string;
  prenom: string;
  nom: string;
  email: string;
  nationalite: string;
  dateArrivee: string;
  montantTotal: number;
  statut: string;
  // Une ligne porte un service du catalogue, ou une nuitee en residence
  lignes: { service: { categorie: string } | null; residenceTarifId?: string | null }[];
}

interface OrdersTableProps {
  orders: Order[];
  filter: string;
  onFilterChange: (f: string) => void;
  total?: number;
  page?: number;
  onPageChange?: (p: number) => void;
  onView?: (id: string) => void;
}

const FILTERS = [
  { key: "", label: "Toutes" },
  { key: "EN_ATTENTE", label: "En attente" },
  { key: "CONFIRMEE", label: "Confirmées" },
  { key: "ANNULEE", label: "Annulées" },
];

const CAT_LABELS: Record<string, string> = {
  transport: "Transport",
  hebergement: "Hôtel",
  repas: "Repas",
  extras: "Extras",
};

export function OrdersTable({
  orders,
  filter,
  onFilterChange,
  total,
  page = 1,
  onPageChange,
  onView,
}: OrdersTableProps) {
  const initials = (prenom: string, nom: string) =>
    `${prenom[0] || ""}${nom[0] || ""}`.toUpperCase();

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate()} mars · ${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
  };

  const totalPages = total ? Math.ceil(total / 10) : 1;

  return (
    <div className="bg-white rounded-2xl border border-line">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4">
        <h3 className="font-serif text-[18px] text-ink">
          {total !== undefined ? "Commandes" : "Dernières commandes"}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <div className="inline-flex bg-cream border border-line rounded-full p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => onFilterChange(f.key)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  filter === f.key ? "bg-ink text-cream" : "text-mute hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="text-[10px] uppercase tracking-[0.18em] text-mute bg-cream/50">
            <tr>
              <th className="text-left font-medium px-5 py-3">Réf</th>
              <th className="text-left font-medium px-5 py-3">Voyageur</th>
              <th className="text-left font-medium px-5 py-3">Arrivée</th>
              <th className="text-left font-medium px-5 py-3">Services</th>
              <th className="text-right font-medium px-5 py-3">Montant</th>
              <th className="text-left font-medium px-5 py-3">Statut</th>
              <th className="text-right font-medium px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => {
              const cats = Array.from(
                new Set(
                  o.lignes
                    .map((l) => l.service?.categorie ?? (l.residenceTarifId ? "hebergement" : null))
                    .filter((c): c is string => Boolean(c)),
                ),
              );
              return (
                <tr key={o.id} className="hover:bg-cream/40">
                  <td className="px-5 py-4 mono text-[12px] text-ink">{o.reference}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-ink text-cream text-[11px] font-semibold flex items-center justify-center">
                        {initials(o.prenom, o.nom)}
                      </div>
                      <div>
                        <p className="text-ink font-medium">
                          {o.nationalite?.slice(0, 4)} {o.prenom} {o.nom}
                        </p>
                        <p className="text-[11px] text-mute truncate max-w-[160px]">{o.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-ink mono text-[12px]">{formatDate(o.dateArrivee)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {cats.map((c) => (
                        <span
                          key={c}
                          className="text-[11px] bg-cream border border-line rounded-full px-2 py-0.5 text-mute"
                        >
                          {CAT_LABELS[c] || c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right mono text-ink font-semibold">
                    {fmt(o.montantTotal)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={o.statut} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => onView?.(o.id)}
                      className="text-mute hover:text-ink"
                    >
                      <Eye size={16} />
                    </button>
                    <button className="text-mute hover:text-ink ml-2">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {onPageChange && (
        <div className="px-5 py-4 flex items-center justify-between text-[12px] text-mute">
          <span>
            {(page - 1) * 10 + 1}–{Math.min(page * 10, total || 0)} sur {total} commandes
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => onPageChange(i + 1)}
                className={`w-7 h-7 rounded text-[12px] ${
                  page === i + 1 ? "bg-ink text-cream" : "hover:bg-cream2"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
