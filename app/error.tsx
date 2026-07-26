"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-[#C8A951] font-mono text-[14px] tracking-widest mb-4">ERREUR</p>
        <h1 className="font-serif text-[40px] leading-tight mb-4">
          Une erreur est survenue
        </h1>
        <p className="text-white/50 text-[15px] leading-relaxed mb-8">
          Nous sommes désolés, quelque chose s&apos;est mal passé. Veuillez réessayer.
        </p>
        <button
          onClick={() => reset()}
          className="inline-block bg-[#C8A951] hover:bg-[#B89A41] text-[#0A0A0A] font-semibold rounded-full px-8 py-3 text-[14px] transition-colors cursor-pointer"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
