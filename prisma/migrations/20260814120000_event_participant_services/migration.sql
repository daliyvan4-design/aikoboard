-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "serviceIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "serviceIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

