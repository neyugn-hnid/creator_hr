-- AlterTable
ALTER TABLE "youtube_channels" ADD COLUMN     "subscriberCount" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "youtube_views" ADD COLUMN     "subscriberCount" BIGINT NOT NULL DEFAULT 0;
