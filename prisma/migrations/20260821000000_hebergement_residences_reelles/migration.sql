-- Hebergement : les vraies residences du parc, plus des services copies.
--
-- Jusqu'ici le pack d'un evenement proposait quatre "services" de categorie
-- hebergement saisis a la main, sans photo ni chambre. Le parc reel vit
-- dans Residence / ResidenceTarif, gere dans /admin/residences. On relie
-- donc l'evenement et le participant a ce parc.

-- Hebergements proposes par l'evenement
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "residenceIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Hebergement choisi par le participant (residence + chambre)
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "residenceId" TEXT;

ALTER TABLE "Participant" DROP CONSTRAINT IF EXISTS "Participant_residenceId_fkey";
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_residenceId_fkey"
  FOREIGN KEY ("residenceId") REFERENCES "Residence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Participant" DROP CONSTRAINT IF EXISTS "Participant_residenceTarifId_fkey";
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_residenceTarifId_fkey"
  FOREIGN KEY ("residenceTarifId") REFERENCES "ResidenceTarif"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Une ligne de devis porte soit un service du catalogue, soit une nuitee
-- dans une residence : serviceId devient facultatif.
ALTER TABLE "LigneCommande" ADD COLUMN IF NOT EXISTS "residenceTarifId" TEXT;
ALTER TABLE "LigneCommande" ALTER COLUMN "serviceId" DROP NOT NULL;

ALTER TABLE "LigneCommande" DROP CONSTRAINT IF EXISTS "LigneCommande_serviceId_fkey";
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LigneCommande" DROP CONSTRAINT IF EXISTS "LigneCommande_residenceTarifId_fkey";
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_residenceTarifId_fkey"
  FOREIGN KEY ("residenceTarifId") REFERENCES "ResidenceTarif"("id") ON DELETE SET NULL ON UPDATE CASCADE;
