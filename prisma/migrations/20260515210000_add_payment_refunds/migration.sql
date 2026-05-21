-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundResponse" JSONB,
ADD COLUMN     "refundedAt" TIMESTAMP(3);
