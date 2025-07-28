-- CreateTable
CREATE TABLE "DJ" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DJ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DJSet" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "duration" INTEGER,
    "vimeo" TEXT,
    "soundcloud" TEXT,
    "mixcloud" TEXT,
    "mediaUrl" TEXT,
    "thumbnailUrl" TEXT,
    "orderInEpisode" INTEGER,
    "djId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DJSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GenresOnSets" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GenresOnSets_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Episode_episodeNumber_key" ON "Episode"("episodeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE INDEX "_GenresOnSets_B_index" ON "_GenresOnSets"("B");

-- AddForeignKey
ALTER TABLE "DJSet" ADD CONSTRAINT "DJSet_djId_fkey" FOREIGN KEY ("djId") REFERENCES "DJ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DJSet" ADD CONSTRAINT "DJSet_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenresOnSets" ADD CONSTRAINT "_GenresOnSets_A_fkey" FOREIGN KEY ("A") REFERENCES "DJSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenresOnSets" ADD CONSTRAINT "_GenresOnSets_B_fkey" FOREIGN KEY ("B") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
