"use client";

import { useEffect, useState, useCallback } from "react";
import { Topbar } from "@/components/admin/topbar";
import { OrdersTable } from "@/components/admin/orders-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { useToast } from "@/components/admin/toast";
import { fmt } from "@/lib/utils";
import { Download, Filter, X } from "lucide-react";

export default function CommandesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const { show } = useToast();

  const loadOrders = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (filter) params.set("status", filter);
    if (search) params.set("search", search);
    fetch(`/api/admin/commandes?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setTotal(d.total || 0);
      });
  }, [page, filter, search]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  function handleStatusChange(id: string, newStatus: string) {
    fetch(`/api/admin/commandes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: newStatus }),
    }).then(() => {
      show("Statut mis à jour");
      loadOrders();
      if (detail?.id === id) setDetail({ ...detail, statut: newStatus });
    });
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    window.open(`/api/admin/commandes/export?${params}`, "_blank");
  }

  function handleView(id: string) {
    fetch(`/api/admin/commandes/${id}`).then((r) => r.json()).then(setDetail);
  }

  return (
    <>
      <Topbar title="Commandes" subtitle={`${total} commandes au total`}>
        <button
          onClick={handleExport}
          className="border border-line rounded-full px-3 py-1.5 text-[12px] flex items-center gap-1.5 hover:border-ink/30"
        >
          <Download size={12} /> Export CSV
        </button>
      </Topbar>
      <div className="p-6 lg:p-10">
        {/* Search */}
        <div className="mb-6 flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par réf, nom, email…"
            className="bg-white border border-line rounded-full px-4 py-2 text-[13px] w-80"
          />
        </div>

        <OrdersTable
          orders={orders}
          filter={filter}
          onFilterChange={(f) => { setFilter(f); setPage(1); }}
          total={total}
          page={page}
          onPageChange={setPage}
          onView={handleView}
        />

        {/* Detail modal */}
        {detail && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
            <div className="bg-white rounded-2xl border border-line max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-[20px] text-ink">{detail.reference}</h3>
                <button onClick={() => setDetail(null)} className="text-mute hover:text-ink"><X size={18} /></button>
              </div>
              <div className="space-y-3 text-[13px]">
                <div className="flex justify-between"><span className="text-mute">Voyageur</span><span className="text-ink font-medium">{detail.prenom} {detail.nom}</span></div>
                <div className="flex justify-between"><span className="text-mute">Email</span><span className="text-ink">{detail.email}</span></div>
                <div className="flex justify-between"><span className="text-mute">Téléphone</span><span className="text-ink">{detail.telephone}</span></div>
                <div className="flex justify-between"><span className="text-mute">Nationalité</span><span className="text-ink">{detail.nationalite}</span></div>
                <div className="flex justify-between"><span className="text-mute">Montant</span><span className="text-ink font-semibold mono">{fmt(detail.montantTotal)}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-mute">Statut</span>
                  <select
                    value={detail.statut}
                    onChange={(e) => handleStatusChange(detail.id, e.target.value)}
                    className="bg-cream border border-line rounded-lg px-3 py-1.5 text-[12px]"
                  >
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="CONFIRMEE">Confirmée</option>
                    <option value="ANNULEE">Annulée</option>
                  </select>
                </div>
              </div>
              {detail.lignes?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-line">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-mute mb-2">Lignes de commande</p>
                  {detail.lignes.map((l: any) => (
                    <div key={l.id} className="flex justify-between text-[13px] py-1">
                      <span className="text-ink">{l.service?.nom || "Service"} × {l.quantite}</span>
                      <span className="mono text-ink">{fmt(l.sousTotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
