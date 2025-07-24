-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MANUFACTURER', 'ADMIN', 'DVA', 'LOGISTICS', 'PHARMACY', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PENDING_DVA_APPROVAL', 'PENDING_ADMIN_APPROVAL', 'ADMIN_REJECTED', 'DVA_REJECTED', 'ON_HOLD', 'CANCELLED', 'PENDING_PRINTING', 'PRINTING_IN_PROGRESS', 'PRINTING_COMPLETE', 'IN_TRANSIT', 'DELIVERED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "companyName" TEXT,
    "companyRegNumber" TEXT,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" SERIAL NOT NULL,
    "drugName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "nafdacNumber" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "manufacturerId" INTEGER NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'PENDING_DVA_APPROVAL',
    "dva_approved_at" TIMESTAMP(3),
    "admin_approved_at" TIMESTAMP(3),
    "print_started_at" TIMESTAMP(3),
    "print_completed_at" TIMESTAMP(3),
    "picked_up_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "cancellation_reason" TEXT,
    "pickup_notes" TEXT,
    "delivery_notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "batchId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanRecord" (
    "id" SERIAL NOT NULL,
    "qrCodeId" INTEGER NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedByRole" "Role" NOT NULL,
    "scannerId" INTEGER,

    CONSTRAINT "ScanRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_companyRegNumber_key" ON "User"("companyRegNumber");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_code_key" ON "QRCode"("code");

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanRecord" ADD CONSTRAINT "ScanRecord_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanRecord" ADD CONSTRAINT "ScanRecord_scannerId_fkey" FOREIGN KEY ("scannerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
