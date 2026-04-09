-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "CompanyProfile_status_idx" ON "CompanyProfile"("status");
