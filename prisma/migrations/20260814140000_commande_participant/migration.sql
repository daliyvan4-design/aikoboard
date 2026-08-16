-- AlterTable
ALTER TABLE "Commande" ADD COLUMN     "participantId" TEXT;

-- CreateIndex
CREATE INDEX "Commande_participantId_idx" ON "Commande"("participantId");

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

