"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Topbar } from "@/components/admin/topbar";
import { PlanningTimeline } from "@/components/admin/planning-timeline";
import { ArrowLeft } from "lucide-react";

interface CommandeData {
  id: string;
  reference: string;
  prenom: string;
  nom: string;
  dateArrivee: string;
  dateDepart: string;
  nombrePersonnes: number;
  telephone: string;
  email: string;
  nationalite: string;
  statut: string;
  notes: string | null;
}

interface PlanningEntry {
  id: string;
  jour: number;
  heure: string;
  type: string;
  titre: string;
  details: string | null;
  auto: boolean;
}

export default function CarnetDeRoutePage() {
  const { commandeId } = useParams<{ commandeId: string }>();
  const router = useRouter();
  const [commande, setCommande] = useState<CommandeData | null>(null);
  const [entries, setEntries] = useState<PlanningEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/commandes/${commandeId}`).then((r) => r.json()),
      fetch(`/api/admin/planning?commandeId=${commandeId}`).then((r) => r.json()),
    ]).then(([cmd, plan]) => {
      setCommande(cmd);
      setEntries(plan);
      setLoading(false);
    });
  }, [commandeId]);

  if (loading) {
    return (
      <>
        <Topbar title="Carnet de route" />
        <div className="p-6 text-center text-mute py-20">Chargement…</div>
      </>
    );
  }

  if (!commande) {
    return (
      <>
        <Topbar title="Carnet de route" />
        <div className="p-6 text-center text-mute py-20">Commande introuvable ou accès refusé</div>
      </>
    );
  }

  return (
    <>
      <Topbar title={`${commande.prenom} ${commande.nom}`} subtitle={commande.reference} >
        <button onClick={() => router.push("/briefing")} className="flex items-center gap-1 text-[13px] text-mute hover:text-ink">
          <ArrowLeft size={16} /> Retour
        </button>
      </Topbar>
      <div className="p-6 lg:p-10">
        <div className="bg-white rounded-2xl border border-line p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
            <div>
              <p className="text-mute text-[10px] uppercase tracking-wider mb-1">Téléphone</p>
              <p className="text-ink">{commande.telephone}</p>
            </div>
            <div>
              <p className="text-mute text-[10px] uppercase tracking-wider mb-1">Email</p>
              <p className="text-ink truncate">{commande.email}</p>
            </div>
            <div>
              <p className="text-mute text-[10px] uppercase tracking-wider mb-1">Nationalité</p>
              <p className="text-ink">{commande.nationalite}</p>
            </div>
            <div>
              <p className="text-mute text-[10px] uppercase tracking-wider mb-1">Personnes</p>
              <p className="text-ink">{commande.nombrePersonnes} pax</p>
            </div>
          </div>
          {commande.notes && (
            <div className="mt-4 pt-4 border-t border-line">
              <p className="text-mute text-[10px] uppercase tracking-wider mb-1">Notes client</p>
              <p className="text-[13px] text-ink">{commande.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-line p-6">
          <h2 className="font-serif text-[18px] text-ink mb-6">Carnet de route</h2>
          {entries.length === 0 ? (
            <p className="text-mute text-center py-8">Aucune entrée de planning. Le planning sera généré à la confirmation de la commande.</p>
          ) : (
            <PlanningTimeline entries={entries} arrivalDate={commande.dateArrivee} />
          )}
        </div>
      </div>
    </>
  );
}
