-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "manageToken" TEXT;

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'geniuspay',
    "event" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebhookEvent_receivedAt_idx" ON "WebhookEvent"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Event_manageToken_key" ON "Event"("manageToken");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_eventId_ticketNumber_key" ON "Participant"("eventId", "ticketNumber");

