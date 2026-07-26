"use client";

import { useState } from "react";
import Link from "next/link";
import { AikoLogo } from "@/components/brand/aiko-logo";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError("Une erreur est survenue. Réessayez.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <AikoLogo dark height={48} />
          <p className="text-[10px] uppercase tracking-[0.18em] text-cream/50 mt-3">Mot de passe oublié</p>
        </div>

        {sent ? (
          <div className="bg-ink2 rounded-2xl p-8 border border-cream/10 text-center">
            <CheckCircle2 className="w-12 h-12 text-gold mx-auto mb-4" />
            <h1 className="font-serif text-cream text-[20px] mb-3">Email envoyé</h1>
            <p className="text-[13px] text-cream/50 leading-relaxed mb-6">
              Si un compte existe pour <strong className="text-cream/70">{email}</strong>, vous recevrez un lien de réinitialisation dans quelques instants.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-gold text-[13px] font-medium hover:text-gold2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-ink2 rounded-2xl p-8 border border-cream/10">
            <h1 className="font-serif text-cream text-[22px] mb-2">Mot de passe oublié</h1>
            <p className="text-[13px] text-cream/40 mb-6">
              Entrez votre email et nous vous enverrons un lien de réinitialisation.
            </p>

            {error && (
              <div className="bg-err/10 border border-err/30 text-err text-[13px] rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="text-[10px] uppercase tracking-[0.22em] text-cream/50 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aiko.com"
                  required
                  className="w-full bg-ink border border-cream/10 rounded-xl pl-10 pr-4 py-3 text-[13px] text-cream placeholder:text-cream/30 focus:border-gold focus:ring-1 focus:ring-gold/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gold hover:bg-gold2 text-ink font-medium rounded-full py-3 text-[14px] btn-press disabled:opacity-50"
            >
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>

            <div className="mt-4 text-center">
              <Link href="/login" className="text-[12px] text-cream/40 hover:text-cream/60 inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                Retour à la connexion
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
