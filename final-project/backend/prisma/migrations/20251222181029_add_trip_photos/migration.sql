-- CreateTable
CREATE TABLE "TripPhoto" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isFeedCover" BOOLEAN NOT NULL DEFAULT false,
    "addedByUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripPhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TripPhoto" ADD CONSTRAINT "TripPhoto_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPhoto" ADD CONSTRAINT "TripPhoto_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
