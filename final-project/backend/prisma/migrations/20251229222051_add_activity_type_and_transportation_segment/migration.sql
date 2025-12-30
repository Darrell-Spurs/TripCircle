-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "activityType" TEXT NOT NULL DEFAULT 'regular';

-- CreateTable
CREATE TABLE "TransportationSegment" (
    "id" SERIAL NOT NULL,
    "fromActivityId" INTEGER NOT NULL,
    "toActivityId" INTEGER NOT NULL,
    "manualStartTime" TIMESTAMP(3),
    "manualEndTime" TIMESTAMP(3),
    "isManualOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportationSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransportationSegment_fromActivityId_idx" ON "TransportationSegment"("fromActivityId");

-- CreateIndex
CREATE INDEX "TransportationSegment_toActivityId_idx" ON "TransportationSegment"("toActivityId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportationSegment_fromActivityId_toActivityId_key" ON "TransportationSegment"("fromActivityId", "toActivityId");

-- AddForeignKey
ALTER TABLE "TransportationSegment" ADD CONSTRAINT "TransportationSegment_fromActivityId_fkey" FOREIGN KEY ("fromActivityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportationSegment" ADD CONSTRAINT "TransportationSegment_toActivityId_fkey" FOREIGN KEY ("toActivityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
