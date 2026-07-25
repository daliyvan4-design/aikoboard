"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <p className="font-serif text-[28px] text-ink mb-3">Erreur</p>
      <p className="text-mute text-[15px] mb-6">Quelque chose s&apos;est mal passe.</p>
      <button
        onClick={reset}
        className="bg-gold hover:bg-gold2 text-ink rounded-full px-6 py-3 text-[14px] font-semibold"
      >
        Reessayer
      </button>
    </div>
  );
}
