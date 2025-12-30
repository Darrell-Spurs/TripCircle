/*
  Warnings:

  - You are about to drop the column `activityType` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the `TransportationSegment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TransportationSegment" DROP CONSTRAINT "TransportationSegment_fromActivityId_fkey";

-- DropForeignKey
ALTER TABLE "TransportationSegment" DROP CONSTRAINT "TransportationSegment_toActivityId_fkey";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "activityType";

-- DropTable
DROP TABLE "TransportationSegment";
