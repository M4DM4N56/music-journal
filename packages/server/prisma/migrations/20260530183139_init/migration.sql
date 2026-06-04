-- CreateEnum
CREATE TYPE "ReleaseGroupType" AS ENUM ('Album', 'EP');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "google_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" TEXT NOT NULL,
    "mbid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_groups" (
    "id" TEXT NOT NULL,
    "mbid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ReleaseGroupType" NOT NULL,
    "first_release_date" DATE,
    "cover_art_url" TEXT,
    "cached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "artist_id" TEXT NOT NULL,

    CONSTRAINT "release_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "release_group_id" TEXT NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diary_entries" (
    "id" TEXT NOT NULL,
    "listened_at" DATE,
    "is_first_listen" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "release_group_id" TEXT NOT NULL,

    CONSTRAINT "diary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "artists_mbid_key" ON "artists"("mbid");

-- CreateIndex
CREATE UNIQUE INDEX "release_groups_mbid_key" ON "release_groups"("mbid");

-- CreateIndex
CREATE INDEX "release_groups_artist_id_idx" ON "release_groups"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_user_id_release_group_id_key" ON "ratings"("user_id", "release_group_id");

-- CreateIndex
CREATE INDEX "diary_entries_user_id_idx" ON "diary_entries"("user_id");

-- CreateIndex
CREATE INDEX "diary_entries_release_group_id_idx" ON "diary_entries"("release_group_id");

-- AddForeignKey
ALTER TABLE "release_groups" ADD CONSTRAINT "release_groups_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_release_group_id_fkey" FOREIGN KEY ("release_group_id") REFERENCES "release_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_release_group_id_fkey" FOREIGN KEY ("release_group_id") REFERENCES "release_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
