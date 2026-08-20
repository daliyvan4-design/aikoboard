-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "aVisa" BOOLEAN,
ADD COLUMN     "dateArrivee" TIMESTAMP(3),
ADD COLUMN     "dateRetour" TIMESTAMP(3),
ADD COLUMN     "numeroVol" TEXT,
ADD COLUMN     "passeport" TEXT,
ADD COLUMN     "paysDepart" TEXT,
ADD COLUMN     "planVol" TEXT,
ADD COLUMN     "typeParticipant" TEXT NOT NULL DEFAULT 'local';

