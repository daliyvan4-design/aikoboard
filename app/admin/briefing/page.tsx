"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/admin/topbar";
import { BriefingCard } from "@/components/admin/briefing-card";
import { ClipboardCheck } from "lucide-react";

interface AssignmentData {
  id: string;
  commande: {
    id: string;
    reference: string;
    prenom: string;
    nom: string;
    dateArrivee: string;
    dateDepart: string;
    nombrePersonnes: number;
    statut: string;
  };
}

export default function BriefingPage() {
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/assignments")
      .then((r) => r.json())
      .then((data) => {
        setAssignments(data);
        setLoading(false);
      });
  }, []);

  const today = new Date();
  const active = assignments.filter((a) => new Date(a.commande.dateDepart) >= today);
  const past = assignments.filter((a) => new Date(a.commande.dateDepart) < today);

  return (
    <>
      <Topbar title="Briefing" subtitle="Vos clients assignés" />
      <div className="p-6 lg:p-10">
        {loading ? (
          <div className="text-center text-mute py-20">Chargement…</div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardCheck size={48} className="mx-auto text-mute/30 mb-4" />
            <p className="text-mute">Aucun client assigné pour le moment</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[12px] uppercase tracking-wider text-mute mb-4">En cours / À venir</h3>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {active.map((a) => (
                    <BriefingCard
                      key={a.id}
                      commandeId={a.commande.id}
                      reference={a.commande.reference}
                      clientName={`${a.commande.prenom} ${a.commande.nom}`}
                      dateArrivee={a.commande.dateArrivee}
                      dateDepart={a.commande.dateDepart}
                      nombrePersonnes={a.commande.nombrePersonnes}
                      statut={a.commande.statut}
                    />
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h3 className="text-[12px] uppercase tracking-wider text-mute mb-4">Passés</h3>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 opacity-60">
                  {past.map((a) => (
                    <BriefingCard
                      key={a.id}
                      commandeId={a.commande.id}
                      reference={a.commande.reference}
                      clientName={`${a.commande.prenom} ${a.commande.nom}`}
                      dateArrivee={a.commande.dateArrivee}
                      dateDepart={a.commande.dateDepart}
                      nombrePersonnes={a.commande.nombrePersonnes}
                      statut={a.commande.statut}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
