-- CreateEnum
CREATE TYPE "ReconcileEventKind" AS ENUM ('PHANTOM', 'MISMATCH', 'RECONCILED', 'STUCK_RESOLVED');

-- CreateTable
CREATE TABLE "ReconcileRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "windowSince" TIMESTAMP(3) NOT NULL,
    "windowUntil" TIMESTAMP(3) NOT NULL,
    "scannedByProvider" JSONB NOT NULL,
    "reconciledCount" INTEGER NOT NULL DEFAULT 0,
    "stuckCount" INTEGER NOT NULL DEFAULT 0,
    "phantomsCount" INTEGER NOT NULL DEFAULT 0,
    "mismatchesCount" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconcileRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconcileEvent" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "kind" "ReconcileEventKind" NOT NULL,
    "provider" "PaymentProvider",
    "reference" TEXT,
    "paymentId" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconcileEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReconcileRun_startedAt_idx" ON "ReconcileRun"("startedAt");

-- CreateIndex
CREATE INDEX "ReconcileEvent_runId_kind_idx" ON "ReconcileEvent"("runId", "kind");

-- CreateIndex
CREATE INDEX "ReconcileEvent_kind_createdAt_idx" ON "ReconcileEvent"("kind", "createdAt");

-- AddForeignKey
ALTER TABLE "ReconcileEvent" ADD CONSTRAINT "ReconcileEvent_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReconcileRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
