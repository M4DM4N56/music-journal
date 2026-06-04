-- DropForeignKey
ALTER TABLE "diary_entries" DROP CONSTRAINT "diary_entries_release_group_id_fkey";

-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_release_group_id_fkey";

-- DropForeignKey
ALTER TABLE "release_groups" DROP CONSTRAINT "release_groups_artist_id_fkey";

-- DropIndex
DROP INDEX "diary_entries_release_group_id_idx";

-- DropIndex
DROP INDEX "ratings_user_id_release_group_id_key";

-- AlterTable
ALTER TABLE "diary_entries" DROP COLUMN "release_group_id",
ADD COLUMN     "album_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ratings" DROP COLUMN "release_group_id",
ADD COLUMN     "album_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "artists";

-- DropTable
DROP TABLE "release_groups";

-- DropEnum
DROP TYPE "ReleaseGroupType";

-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL,
    "itunes_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "artist_id" INTEGER NOT NULL,
    "cover_art_url" TEXT,
    "release_year" INTEGER,
    "cached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "albums_itunes_id_key" ON "albums"("itunes_id");

-- CreateIndex
CREATE INDEX "albums_artist_id_idx" ON "albums"("artist_id");

-- CreateIndex
CREATE INDEX "diary_entries_album_id_idx" ON "diary_entries"("album_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_user_id_album_id_key" ON "ratings"("user_id", "album_id");

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
