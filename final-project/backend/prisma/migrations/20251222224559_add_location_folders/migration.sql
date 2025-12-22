-- CreateTable
CREATE TABLE "LocationFolder" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedLocation" (
    "id" SERIAL NOT NULL,
    "folderId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "placeId" TEXT NOT NULL,
    "notes" TEXT,
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationFolderShareLink" (
    "id" SERIAL NOT NULL,
    "folderId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationFolderShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationFolderMember" (
    "id" SERIAL NOT NULL,
    "folderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationFolderMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocationFolder_userId_idx" ON "LocationFolder"("userId");

-- CreateIndex
CREATE INDEX "SavedLocation_folderId_idx" ON "SavedLocation"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "LocationFolderShareLink_token_key" ON "LocationFolderShareLink"("token");

-- CreateIndex
CREATE INDEX "LocationFolderShareLink_token_idx" ON "LocationFolderShareLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "LocationFolderMember_folderId_userId_key" ON "LocationFolderMember"("folderId", "userId");

-- AddForeignKey
ALTER TABLE "LocationFolder" ADD CONSTRAINT "LocationFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedLocation" ADD CONSTRAINT "SavedLocation_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "LocationFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationFolderShareLink" ADD CONSTRAINT "LocationFolderShareLink_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "LocationFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationFolderMember" ADD CONSTRAINT "LocationFolderMember_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "LocationFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationFolderMember" ADD CONSTRAINT "LocationFolderMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
