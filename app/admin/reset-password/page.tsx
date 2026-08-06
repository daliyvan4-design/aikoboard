"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AikoLogo } from "@/components/brand/aiko-logo";
import { Lock, CheckCircle2, ArrowLeft } from "lucide-react";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="bg-ink2 rounded-2xl p-8 border border-cream/10 text-center">
        <p className="text-cream/50 text-[14px] mb-4">Lien invalide ou expiré.</p>
        <Link href="/admin/forgot-password" className="text-gold text-[13px] font-medium hover:text-gold2">
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la réinitialisation.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="bg-ink2 rounded-2xl p-8 border border-cream/10 text-center">
        <CheckCircle2 className="w-12 h-12 text-gold mx-auto mb-4" />
        <h1 className="font-serif text-cream text-[20px] mb-3">Mot de passe modifié</h1>
        <p className="text-[13px] text-cream/50 mb-6">
          Votre mot de passe a été réinitialisé avec succès.
        </p>
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-6 py-3 text-[14px] font-semibold btn-press"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-ink2 rounded-2xl p-8 border border-cream/10">
      <h1 className="font-serif text-cream text-[22px] mb-2">Nouveau mot de passe</h1>
      <p className="text-[13px] text-cream/40 mb-6">Choisissez un nouveau mot de passe pour votre compte.</p>

      {error && (
        <div className="bg-err/10 border border-err/30 text-err text-[13px] rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-[0.22em] text-cream/50 mb-2 block">Nouveau mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 caractères"
              required
              minLength={6}
              className="w-full bg-ink border border-cream/10 rounded-xl pl-10 pr-4 py-3 text-[13px] text-cream placeholder:text-cream/30 focus:border-gold focus:ring-1 focus:ring-gold/30"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.22em] text-cream/50 mb-2 block">Confirmer</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Retapez le mot de passe"
              required
              className="w-full bg-ink border border-cream/10 rounded-xl pl-10 pr-4 py-3 text-[13px] text-cream placeholder:text-cream/30 focus:border-gold focus:ring-1 focus:ring-gold/30"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 bg-gold hover:bg-gold2 text-ink font-medium rounded-full py-3 text-[14px] btn-press disabled:opacity-50"
      >
        {loading ? "Réinitialisation…" : "Réinitialiser"}
      </button>

      <div className="mt-4 text-center">
        <Link href="/admin/login" className="text-[12px] text-cream/40 hover:text-cream/60 inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          Retour à la connexion
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <AikoLogo dark height={48} />
          <p className="text-[10px] uppercase tracking-[0.18em] text-cream/50 mt-3">Réinitialisation</p>
        </div>
        <Suspense fallback={<div className="text-cream/30 text-center">Chargement…</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
