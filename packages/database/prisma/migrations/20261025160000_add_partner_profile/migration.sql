-- AlterTable
ALTER TABLE "partners" ADD COLUMN "logo_url" TEXT;
ALTER TABLE "partners" ADD COLUMN "details_confirmed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "partner_users" ADD COLUMN "avatar_url" TEXT;
