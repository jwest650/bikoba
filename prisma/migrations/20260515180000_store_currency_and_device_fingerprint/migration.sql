-- DropIndex
DROP INDEX "Session_userId_userAgent_idx";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "deviceFingerprint" TEXT;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD';

-- CreateIndex
CREATE INDEX "Session_userId_deviceFingerprint_idx" ON "Session"("userId", "deviceFingerprint");
