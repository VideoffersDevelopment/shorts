-- CreateEnum
CREATE TYPE "ShortStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PROCESSING', 'PUBLISHED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PRZELEWY24', 'TPAY', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CreditSource" AS ENUM ('PACKAGE', 'GIFT', 'PROMO', 'REFUND', 'ADMIN', 'PUBLICATION', 'OTHER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "publicationCredits" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Short" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "muxAssetId" TEXT,
    "muxPlaybackId" TEXT,
    "muxUploadId" TEXT,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "ctaLink" TEXT,
    "status" "ShortStatus" NOT NULL DEFAULT 'DRAFT',
    "thumbnailUrl" TEXT,
    "customThumbnail" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER,
    "aspectRatio" TEXT,
    "publishedAt" TIMESTAMPTZ(6),
    "archivedAt" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6),
    "processingError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Short_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortStats" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "ctaClicks" INTEGER NOT NULL DEFAULT 0,
    "avgWatchTime" DOUBLE PRECISION,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ShortStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "slug" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortTag" (
    "shortId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ShortTag_pkey" PRIMARY KEY ("shortId","tagId")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shortId" TEXT,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'PRZELEWY24',
    "providerPaymentId" TEXT NOT NULL,
    "providerSessionId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "invoiceUrl" TEXT,
    "metadata" JSONB,
    "creditsGranted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" "CreditSource" NOT NULL,
    "shortId" TEXT,
    "paymentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Short_muxAssetId_key" ON "Short"("muxAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "Short_muxPlaybackId_key" ON "Short"("muxPlaybackId");

-- CreateIndex
CREATE INDEX "Short_companyId_idx" ON "Short"("companyId");

-- CreateIndex
CREATE INDEX "Short_status_idx" ON "Short"("status");

-- CreateIndex
CREATE INDEX "Short_publishedAt_idx" ON "Short"("publishedAt");

-- CreateIndex
CREATE INDEX "Short_expiresAt_idx" ON "Short"("expiresAt");

-- CreateIndex
CREATE INDEX "Short_categoryId_idx" ON "Short"("categoryId");

-- CreateIndex
CREATE INDEX "Short_muxAssetId_idx" ON "Short"("muxAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "ShortStats_shortId_key" ON "ShortStats"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_slug_idx" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_usageCount_idx" ON "Tag"("usageCount");

-- CreateIndex
CREATE INDEX "ShortTag_shortId_idx" ON "ShortTag"("shortId");

-- CreateIndex
CREATE INDEX "ShortTag_tagId_idx" ON "ShortTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_shortId_key" ON "Payment"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerSessionId_key" ON "Payment"("providerSessionId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_shortId_idx" ON "Payment"("shortId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_provider_idx" ON "Payment"("provider");

-- CreateIndex
CREATE INDEX "Payment_providerPaymentId_idx" ON "Payment"("providerPaymentId");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_source_idx" ON "CreditTransaction"("source");

-- CreateIndex
CREATE INDEX "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "Short" ADD CONSTRAINT "Short_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Short" ADD CONSTRAINT "Short_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortStats" ADD CONSTRAINT "ShortStats_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "Short"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortTag" ADD CONSTRAINT "ShortTag_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "Short"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortTag" ADD CONSTRAINT "ShortTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "Short"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "Short"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
