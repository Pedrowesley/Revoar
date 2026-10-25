-- CreateTable
CREATE TABLE "room_images" (
    "id" TEXT NOT NULL,
    "room_type_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "alt_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_images_room_type_id_idx" ON "room_images"("room_type_id");

-- AddForeignKey
ALTER TABLE "room_images" ADD CONSTRAINT "room_images_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
