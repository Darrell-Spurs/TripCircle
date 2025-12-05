-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "body" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3);
