-- AlterTable
ALTER TABLE "Feed" ADD COLUMN     "articleCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
