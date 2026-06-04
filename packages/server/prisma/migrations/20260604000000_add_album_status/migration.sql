-- CreateTable
CREATE TABLE "album_status" (
    "id" TEXT NOT NULL,
    "listened" BOOLEAN NOT NULL DEFAULT false,
    "next_up" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "itunes_id" INTEGER NOT NULL,

    CONSTRAINT "album_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "album_status_user_id_idx" ON "album_status"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "album_status_user_id_itunes_id_key" ON "album_status"("user_id", "itunes_id");

-- AddForeignKey
ALTER TABLE "album_status" ADD CONSTRAINT "album_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
