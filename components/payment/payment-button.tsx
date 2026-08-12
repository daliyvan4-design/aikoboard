"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

interface Props {
  amount: number;
  currency?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  eventSlug?: string;
  participantRef?: string;
  type?: "event_creation" | "badge" | "ticket" | "reservation";
  /**
   * Preparation avant paiement (creation de l'inscription ou de l'evenement).
   * Renvoyer `abort: true` empeche le debit quand cette etape a echoue.
   */
  onBeforePay?: () => Promise<{
    participantRef?: string;
    eventSlug?: string;
    abort?: boolean;
    error?: string;
  } | void>;
  onError?: (message: string) => void;
  disabled?: boolean;
  label?: string;
}

export function PaymentButton({
  amount,
  currency = "XOF",
  description,
  customerName,
  customerEmail,
  customerPhone,
  eventSlug,
  participantRef,
  type,
  onBeforePay,
  onError,
  disabled,
  label,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);

    try {
      let finalEventSlug = eventSlug;
      let finalParticipantRef = participantRef;

      if (onBeforePay) {
        const result = await onBeforePay();
        if (result?.abort) {
          onError?.(result.error ?? "Impossible de preparer le paiement");
          return;
        }
        if (result?.eventSlug) finalEventSlug = result.eventSlug;
        if (result?.participantRef) finalParticipantRef = result.participantRef;
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency,
          description,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          event_slug: finalEventSlug,
          participant_ref: finalParticipantRef,
          type,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        onError?.(data.error ?? "Erreur lors du paiement");
        return;
      }

      const redirectUrl = data.checkout_url ?? data.payment_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        onError?.("Aucune URL de paiement retournee");
      }
    } catch {
      onError?.("Impossible de contacter le serveur de paiement");
    } finally {
      setLoading(false);
    }
  };

  const formatted = new Intl.NumberFormat("fr-FR").format(amount);
  const buttonLabel = label ?? `Payer ${formatted} ${currency}`;

  return (
    <div>
      <button
        type="button"
        onClick={handlePay}
        disabled={disabled || loading}
        className="btn-press w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-8 py-4 text-[15px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          buttonLabel
        )}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-mute mt-3">
        <ShieldCheck className="w-3.5 h-3.5" />
        Paiement securise via GeniusPay
      </p>
    </div>
  );
}
