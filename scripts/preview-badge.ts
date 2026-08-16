import QRCode from "qrcode";
import { writeFileSync } from "fs";
import path from "path";
import { generateSinglePvcBadge } from "../lib/generate-pvc-badge-pdf";

/**
 * Genere un badge de demonstration pour verifier le rendu reel du PDF
 * plutot que de se fier a une maquette.
 *
 *   npx tsx scripts/preview-badge.ts
 *   qlmanage -t -s 1600 -o /tmp /tmp/badge-recto.pdf
 *
 * Aucune photo n'est fournie : c'est le cadre de remplacement qui
 * s'affiche, exactement comme pour un participant qui n'en a pas envoye.
 */
const OUT = process.env.BADGE_OUT ?? "/tmp";

async function main() {
  const qrDataUrl = await QRCode.toDataURL(
    JSON.stringify({
      ref: "AIKO-76EE3F40",
      event: "AIKO Event Manager",
      name: "Amadou Diallo",
      type: "badge",
      ticket: 42,
    }),
    { width: 600, margin: 0, color: { dark: "#0A1628", light: "#FFFFFF" } },
  );

  const pdf = generateSinglePvcBadge({
    eventName: "AIKO Event Manager",
    eventDate: "15 – 16 septembre 2026",
    eventLieu: "Sofitel Hôtel Ivoire · Abidjan",
    eventType: "conference",
    organisateur: "AIKO Board",
    participant: {
      name: "Amadou Diallo",
      titre: "Managing Director",
      organisation: "AIKO Group International",
      email: "amadou@example.com",
      reference: "AIKO-76EE3F40",
      badgeNumber: 42,
      qrDataUrl,
    },
  });

  writeFileSync(path.join(OUT, "badge-recto.pdf"), Buffer.from(pdf.output("arraybuffer")));

  // Meme badge, premiere page retiree : permet de visualiser le verso seul
  pdf.deletePage(1);
  writeFileSync(path.join(OUT, "badge-verso.pdf"), Buffer.from(pdf.output("arraybuffer")));

  console.log("recto + verso ecrits dans", OUT);
}

main().catch((e) => {
  console.error("ERREUR:", e.message);
  process.exitCode = 1;
});
