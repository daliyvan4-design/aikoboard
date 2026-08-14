"use client";

interface ConciergeLoad {
  id: string;
  nom: string;
  initials: string;
  activeClients: number;
  lastNoteDate: string | null;
}

interface TeamLoadCardProps {
  concierges: ConciergeLoad[];
}

export function TeamLoadCard({ concierges }: TeamLoadCardProps) {
  const maxClients = Math.max(...concierges.map((c) => c.activeClients), 1);

  function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "—";
    // Un libelle relatif ("il y a 5min") a besoin de l'heure courante. Ce
    // composant est client-only (back-office), sans rendu serveur a
    // desynchroniser.
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  }

  return (
    <div className="bg-white rounded-2xl border border-line shadow-card">
      <div className="px-5 py-4">
        <h3 className="font-serif text-[18px] text-ink">Charge de l&apos;équipe</h3>
      </div>
      {/* Un tableau large scrolle dans sa carte au lieu de pousser toute la page. */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="text-[10px] uppercase tracking-[0.18em] text-mute bg-cream/50">
            <tr>
              <th className="text-left font-medium px-5 py-3">Concierge</th>
              <th className="text-left font-medium px-5 py-3">Clients actifs</th>
              <th className="text-left font-medium px-5 py-3">Charge</th>
              <th className="text-right font-medium px-5 py-3">Dernière activité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {concierges.map((c) => (
              <tr key={c.id} className="hover:bg-cream/40">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-ink text-[11px] font-semibold font-serif">
                      {c.initials}
                    </div>
                    <span className="text-ink font-medium">{c.nom}</span>
                  </div>
                </td>
                <td className="px-5 py-4 mono text-ink">{c.activeClients}</td>
                <td className="px-5 py-4 w-40">
                  <div className="h-2 bg-cream rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ink rounded-full"
                      style={{ width: `${(c.activeClients / maxClients) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="px-5 py-4 text-right text-mute">{timeAgo(c.lastNoteDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {concierges.length === 0 && (
        <div className="px-5 py-8 text-center text-mute text-[13px]">Aucun concierge actif</div>
      )}
    </div>
  );
}
