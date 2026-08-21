"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Car, Loader2, Plane, Users } from "lucide-react";

/**
 * Catalogue des véhicules et des transferts.
 *
 * Le formulaire d'inscription n'affiche qu'une liste courte : le bouton
 * « Plus de véhicules » ouvre cette page, qui montre toute la flotte avec
 * ses tarifs. Les données viennent du catalogue administré dans
 * /admin/tarifs — aucune valeur n'est écrite en dur ici.
 */

interface Service {
  id: string;
  nom: string;
  description: string | null;
  categorie: string;
  prixBase: number;
  unite: string;
}

const SECTIONS: { categorie: string; titre: string; lead: string }[] = [
  {
    categorie: "vehicule",
    titre: "Véhicules avec chauffeur",
    lead: "Un seul véhicule par participant. Le chauffeur, le carburant et le péage sont compris.",
  },
  {
    categorie: "transport",
    titre: "Transferts & accueil",
    lead: "Accueil à l'aéroport, escorte et liaisons ponctuelles.",
  },
];

function formatPrice(prix: number, unite: string) {
  if (prix <= 0) return "Inclus";
  return `${new Intl.NumberFormat("fr-FR").format(prix)} XOF / ${unite}`;
}

export default function VehiculesPage() {
  const locale = useLocale();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((grouped: Record<string, Service[]>) => {
        setServices(Object.values(grouped ?? {}).flat());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="animate-fade-up">
      <div className="max-w-5xl mx-auto px-5 lg:px-8 pt-10 pb-24">
        <Link
          href={`/${locale}`}
          className="text-[13px] text-mute hover:text-ink flex items-center gap-1.5 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <h1 className="font-serif text-[32px] sm:text-[40px] text-ink mb-2">
          V{"é"}hicules {"&"} transferts
        </h1>
        <p className="text-mute text-[14px] mb-12">
          Notre flotte et nos prestations d{"'"}accueil, avec leurs tarifs indicatifs.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-[14px] text-mute py-10">
            <Loader2 className="w-4 h-4 animate-spin text-gold" />
            Chargement du catalogue{"…"}
          </div>
        ) : (
          <div className="space-y-14">
            {SECTIONS.map((section) => {
              const list = services.filter((s) => s.categorie === section.categorie);
              if (list.length === 0) return null;
              const Icone = section.categorie === "vehicule" ? Car : Plane;

              return (
                <div key={section.categorie}>
                  <div className="flex items-start gap-3 mb-1">
                    <Icone className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                    <h2 className="font-serif text-[24px] text-ink">{section.titre}</h2>
                  </div>
                  <p className="text-[13px] text-mute mb-6 ml-8">{section.lead}</p>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {list.map((s) => (
                      <div
                        key={s.id}
                        className="border border-line bg-cream2 rounded-2xl p-5 card-hover min-w-0"
                      >
                        <p className="text-[15px] text-ink font-medium">{s.nom}</p>
                        {s.description && (
                          <p className="text-[12px] text-mute mt-1.5 leading-relaxed">
                            {s.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-line">
                          <span className="text-[11px] text-mute flex items-center gap-1.5">
                            <Users className="w-3 h-3" />
                            avec chauffeur
                          </span>
                          <span className="text-[14px] font-semibold text-ink">
                            {formatPrice(s.prixBase, s.unite)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {services.length === 0 && (
              <p className="text-[14px] text-mute py-10">
                Aucun v{"é"}hicule au catalogue pour le moment.
              </p>
            )}
          </div>
        )}

        <div className="h-px bg-line mt-16 mb-6" />
        <p className="text-[13px] text-mute">
          Ces prestations se demandent au moment de l{"'"}inscription {"à"} un
          {"é"}v{"é"}nement. L{"'"}{"é"}quipe confirme le tarif d{"é"}finitif selon vos
          dates et votre programme.
        </p>
      </div>
    </section>
  );
}
