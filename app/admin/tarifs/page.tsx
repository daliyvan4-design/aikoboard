"use client";

import { useEffect, useState, useCallback } from "react";
import { Topbar } from "@/components/admin/topbar";
import { TariffCategory } from "@/components/admin/tariff-category";
import { useToast } from "@/components/admin/toast";
import { Search } from "lucide-react";

interface Service {
  id: string;
  nom: string;
  categorie: string;
  actif: boolean;
  prixBase: number;
  unite: string;
  tarifs: { id: string; label: string; prix: number }[];
}

/**
 * Ordre d'affichage souhaite. Toute categorie absente de cette liste
 * s'affiche quand meme, a la suite : une nouvelle famille de prestations
 * ne doit pas disparaitre du back-office parce qu'on a oublie de
 * l'ajouter ici — c'est exactement ce qui est arrive aux vehicules.
 */
const ORDRE_CATEGORIES = ["vehicule", "transport", "hebergement", "repas", "extras"];

export default function TarifsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const { show } = useToast();

  const load = useCallback(() => {
    // Route admin : elle renvoie aussi les services masques, sans quoi un
    // service desactive ne pourrait plus jamais etre reactive.
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((res: { success?: boolean; data?: Service[] }) => {
        setServices(res.data ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleLabelChange(tarifId: string, label: string) {
    await fetch(`/api/admin/tarifs/${tarifId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    show("Tarif renommé");
  }

  async function handlePriceChange(tarifId: string, prix: number) {
    await fetch(`/api/admin/tarifs/${tarifId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prix }),
    });
    show("Prix mis à jour");
    load();
  }

  async function handleToggleVisible(serviceId: string, actif: boolean) {
    await fetch(`/api/admin/services/${serviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif }),
    });
    show(actif ? "Service rendu visible" : "Service masqué");
    load();
  }

  async function handleDeleteTarif(tarifId: string) {
    await fetch(`/api/admin/tarifs/${tarifId}`, { method: "DELETE" });
    show("Tarif supprimé");
    load();
  }

  async function handlePrixBaseChange(serviceId: string, prixBase: number) {
    await fetch(`/api/admin/services/${serviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prixBase }),
    });
    show("Prix de référence mis à jour");
    load();
  }

  async function handleAddTarif(serviceId: string) {
    await fetch("/api/admin/tarifs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId, label: "Nouveau tarif", prix: 0 }),
    });
    show("Tarif ajouté");
    load();
  }

  const filtered = search
    ? services.filter((s) => s.nom.toLowerCase().includes(search.toLowerCase()) ||
        s.tarifs.some((t) => t.label.toLowerCase().includes(search.toLowerCase())))
    : services;

  const totalTarifs = services.reduce((s, svc) => s + Math.max(1, svc.tarifs.length), 0);

  // Categories reellement presentes, dans l'ordre voulu puis les autres
  const categories = [
    ...ORDRE_CATEGORIES.filter((c) => services.some((s) => s.categorie === c)),
    ...[...new Set(services.map((s) => s.categorie))].filter((c) => !ORDRE_CATEGORIES.includes(c)),
  ];

  return (
    <>
      <Topbar title="Éditeur de tarifs" subtitle={`${totalTarifs} tarifs · Synchronisé`} />
      <div className="p-6 lg:p-10 space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-line rounded-full px-4 py-2 flex items-center gap-2">
            <Search size={14} className="text-mute" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-[13px] w-60 outline-none"
              placeholder="Rechercher un tarif…"
            />
          </div>
        </div>

        {categories.map((cat) => {
          const catServices = filtered.filter((s) => s.categorie === cat);
          if (catServices.length === 0) return null;
          return (
            <TariffCategory
              key={cat}
              categorie={cat}
              services={catServices}
              onLabelChange={handleLabelChange}
              onPriceChange={handlePriceChange}
              onToggleVisible={handleToggleVisible}
              onDeleteTarif={handleDeleteTarif}
              onAddTarif={handleAddTarif}
              onPrixBaseChange={handlePrixBaseChange}
            />
          );
        })}
      </div>
    </>
  );
}
