-- CreateTable
CREATE TABLE "TripComment" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TripComment" ADD CONSTRAINT "TripComment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripComment" ADD CONSTRAINT "TripComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
