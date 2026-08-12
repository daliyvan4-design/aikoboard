import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/admin-auth";
import { anonymizeParticipant } from "@/lib/anonymize";
import { log } from "@/lib/logger";

/**
 * Droit à l'effacement (RGPD art. 17) : efface les données identifiantes
 * d'une inscription à la demande du participant.
 *
 * L'inscription elle-même est conservée (numéro de ticket, montant,
 * check-in) : ces éléments sont comptables et ne permettent plus
 * d'identifier quiconque une fois les coordonnées effacées.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { session, error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  try {
    const { ref } = await params;
    const done = await anonymizeParticipant(ref);

    if (!done) {
      return NextResponse.json(
        { success: false, error: "Inscription introuvable ou deja anonymisee" },
        { status: 404 },
      );
    }

    log.info("Anonymisation manuelle", { ref, action: "anonymize", by: session.user.id });
    return NextResponse.json({ success: true });
  } catch (err) {
    log.error(
      "Anonymisation impossible",
      { route: "POST /api/admin/participants/[ref]/anonymize" },
      err,
    );
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
