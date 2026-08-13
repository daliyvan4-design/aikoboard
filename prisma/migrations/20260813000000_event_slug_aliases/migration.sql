-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "slugAliases" TEXT[] DEFAULT ARRAY[]::TEXT[];

