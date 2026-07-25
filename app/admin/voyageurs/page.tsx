"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/admin/topbar";
import { fmt } from "@/lib/utils";
import { Search } from "lucide-react";

interface Voyageur {
  email: string;
  prenom: string;
  nom: string;
  telephone: string;
  nationalite: string;
  commandeCount: number;
  totalAmount: number;
  lastOrder: string;
}

export default function VoyageursPage() {
  const [voyageurs, setVoyageurs] = useState<Voyageur[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/admin/voyageurs?${params}`)
      .then((r) => r.json())
      .then(setVoyageurs);
  }, [search]);

  return (
    <>
      <Topbar title="Voyageurs" subtitle={`${voyageurs.length} voyageurs`} />
      <div className="p-6 lg:p-10">
        <div className="mb-6">
          <div className="bg-white border border-line rounded-full px-4 py-2 inline-flex items-center gap-2">
            <Search size={14} className="text-mute" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-[13px] w-60 outline-none"
              placeholder="Rechercher un voyageur…"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-line overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="text-[10px] uppercase tracking-[0.18em] text-mute bg-cream/50">
              <tr>
                <th className="text-left font-medium px-5 py-3">Voyageur</th>
                <th className="text-left font-medium px-5 py-3">Email</th>
                <th className="text-left font-medium px-5 py-3">Téléphone</th>
                <th className="text-left font-medium px-5 py-3">Nationalité</th>
                <th className="text-right font-medium px-5 py-3">Commandes</th>
                <th className="text-right font-medium px-5 py-3">Montant total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {voyageurs.map((v) => (
                <tr key={v.email} className="hover:bg-cream/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-ink text-cream text-[11px] font-semibold flex items-center justify-center">
                        {v.prenom[0]}{v.nom[0]}
                      </div>
                      <span className="text-ink font-medium">{v.prenom} {v.nom}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-mute">{v.email}</td>
                  <td className="px-5 py-4 text-mute mono">{v.telephone}</td>
                  <td className="px-5 py-4 text-mute">{v.nationalite}</td>
                  <td className="px-5 py-4 text-right mono text-ink">{v.commandeCount}</td>
                  <td className="px-5 py-4 text-right mono text-ink font-semibold">{fmt(v.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
