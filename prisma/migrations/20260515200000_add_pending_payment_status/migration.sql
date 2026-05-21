-- AlterEnum
-- Postgres requires ADD VALUE to commit before the new value can be used elsewhere,
-- so this lives in its own migration ahead of any column using PENDING_PAYMENT.
ALTER TYPE "OrderStatus" ADD VALUE 'PENDING_PAYMENT';
