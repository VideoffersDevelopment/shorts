-- Wallet System: Credit Batches, Dual Wallet, Configurable Pricing
-- Breaking change: removes publicationCredits, CreditSource, Payment.shortId
-- Pre-requisite: no real user data (deployment phase)

-- ============================================================
-- Step 0: Clean up test data that conflicts with schema changes
-- ============================================================
DELETE FROM "CreditTransaction";
DELETE FROM "Payment";

-- ============================================================
-- Step 1: Create new enums
-- ============================================================

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('PROMO', 'MAIN');

-- CreateEnum
CREATE TYPE "CreditBatchType" AS ENUM ('PROMO_GRANT', 'PURCHASED', 'BONUS', 'EARNED_TIP');

-- CreateEnum
CREATE TYPE "CreditActionType" AS ENUM ('PUBLICATION', 'EXTENSION', 'BOOST_STD', 'SUPER_LIKE', 'MAINTENANCE_FEE', 'REFUND', 'PROMO_EXPIRED', 'ADMIN_GRANT');

-- AlterEnum
ALTER TYPE "ShortStatus" ADD VALUE 'EXPIRED';

-- ============================================================
-- Step 2: Drop old foreign keys and indexes
-- ============================================================

-- DropForeignKey
ALTER TABLE "CreditTransaction" DROP CONSTRAINT IF EXISTS "CreditTransaction_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_shortId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "CreditTransaction_source_idx";
DROP INDEX IF EXISTS "Payment_shortId_idx";
DROP INDEX IF EXISTS "Payment_shortId_key";

-- Drop custom indexes that were recreated differently
DROP INDEX IF EXISTS "idx_company_name_trigram";
DROP INDEX IF EXISTS "idx_shorts_title_trigram";
DROP INDEX IF EXISTS "idx_short_stats_shortid";
DROP INDEX IF EXISTS "idx_tags_usage";

-- ============================================================
-- Step 3: Alter existing tables
-- ============================================================

-- AlterTable: CreditTransaction — remove old source, add new actionType + batchId
ALTER TABLE "CreditTransaction" DROP COLUMN "source",
ADD COLUMN     "actionType" "CreditActionType" NOT NULL DEFAULT 'PUBLICATION',
ADD COLUMN     "batchId" TEXT;

-- Remove the default after adding (it was only needed for migration)
ALTER TABLE "CreditTransaction" ALTER COLUMN "actionType" DROP DEFAULT;

-- AlterTable: Payment — remove shortId (packages are not linked to specific shorts)
ALTER TABLE "Payment" DROP COLUMN "shortId";

-- AlterTable: User — remove flat publicationCredits (replaced by CreditBatch system)
ALTER TABLE "User" DROP COLUMN "publicationCredits";

-- DropEnum
DROP TYPE "CreditSource";

-- ============================================================
-- Step 4: Create new tables
-- ============================================================

-- CreateTable: ShortBoost
CREATE TABLE "ShortBoost" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STANDARD',
    "cost" INTEGER NOT NULL,
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "ShortBoost_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CreditBatch (core of the dual wallet system)
CREATE TABLE "CreditBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wallet" "WalletType" NOT NULL,
    "type" "CreditBatchType" NOT NULL,
    "initialAmount" INTEGER NOT NULL,
    "currentBalance" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "lastActivityAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CreditBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PricingConfig (admin-configurable service pricing)
CREATE TABLE "PricingConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "cost" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "PricingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable: NotificationLog (anti-spam for retention notifications)
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "batchId" TEXT,
    "channel" TEXT NOT NULL,
    "sentAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- Step 5: Create indexes
-- ============================================================

-- ShortBoost indexes
CREATE INDEX "ShortBoost_shortId_idx" ON "ShortBoost"("shortId");
CREATE INDEX "ShortBoost_userId_idx" ON "ShortBoost"("userId");
CREATE INDEX "ShortBoost_status_idx" ON "ShortBoost"("status");
CREATE INDEX "ShortBoost_expiresAt_idx" ON "ShortBoost"("expiresAt");

-- CreditBatch indexes
CREATE INDEX "CreditBatch_userId_wallet_idx" ON "CreditBatch"("userId", "wallet");
CREATE INDEX "CreditBatch_expiresAt_idx" ON "CreditBatch"("expiresAt");
CREATE INDEX "CreditBatch_userId_currentBalance_idx" ON "CreditBatch"("userId", "currentBalance");

-- PricingConfig indexes
CREATE UNIQUE INDEX "PricingConfig_key_key" ON "PricingConfig"("key");
CREATE INDEX "PricingConfig_key_idx" ON "PricingConfig"("key");
CREATE INDEX "PricingConfig_category_idx" ON "PricingConfig"("category");

-- NotificationLog indexes
CREATE INDEX "NotificationLog_userId_idx" ON "NotificationLog"("userId");
CREATE INDEX "NotificationLog_triggerType_idx" ON "NotificationLog"("triggerType");
CREATE UNIQUE INDEX "NotificationLog_userId_triggerType_batchId_key" ON "NotificationLog"("userId", "triggerType", "batchId");

-- CreditTransaction new indexes
CREATE INDEX "CreditTransaction_actionType_idx" ON "CreditTransaction"("actionType");
CREATE INDEX "CreditTransaction_batchId_idx" ON "CreditTransaction"("batchId");

-- ============================================================
-- Step 6: Add foreign keys
-- ============================================================

-- ShortBoost foreign keys
ALTER TABLE "ShortBoost" ADD CONSTRAINT "ShortBoost_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "Short"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShortBoost" ADD CONSTRAINT "ShortBoost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreditBatch foreign keys
ALTER TABLE "CreditBatch" ADD CONSTRAINT "CreditBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreditTransaction new foreign key (batch)
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CreditBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- NotificationLog foreign keys
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
