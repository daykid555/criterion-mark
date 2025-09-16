-- AlterEnum
ALTER TYPE "public"."ReportStatus" ADD VALUE 'FORWARDED_TO_STORE';

-- CreateTable
CREATE TABLE "public"."CounterfeitContent" (
    "id" SERIAL NOT NULL,
    "productName" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "warningText" TEXT NOT NULL,
    "warningVideoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CounterfeitContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CounterfeitContent_qrCode_key" ON "public"."CounterfeitContent"("qrCode");
