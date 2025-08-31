-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANUFACTURER', 'DVA', 'CUSTOMER', 'PRINTING', 'LOGISTICS', 'LOGISTICS_DISTRIBUTOR', 'PHARMACY', 'SKINCARE_BRAND');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PENDING_DVA_APPROVAL', 'PENDING_ADMIN_APPROVAL', 'ADMIN_REJECTED', 'DVA_REJECTED', 'PENDING_PRINTING', 'PRINTING_COMPLETE', 'READY_FOR_SEALING', 'READY_FOR_SHIPPING', 'DELIVERED', 'ON_HOLD', 'CANCELLED', 'PRINTING_IN_PROGRESS', 'IN_TRANSIT', 'PENDING_MANUFACTURER_CONFIRMATION');

-- CreateEnum
CREATE TYPE "QRCodeStatus" AS ENUM ('UNUSED', 'SEALED', 'VERIFIED_ONCE', 'FLAGGED', 'INVALID_STATE', 'USED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING_PICKUP', 'IN_TRANSIT', 'AWAITING_VERIFICATION', 'DELIVERED', 'REJECTED');

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
    "delivery_confirmation_code" TEXT DEFAULT '',
    "manufacturer_received_quantity" INTEGER,
    "seal_background_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "delivery_notes" TEXT,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "batchId" INTEGER NOT NULL,
    "status" "QRCodeStatus" NOT NULL DEFAULT 'UNUSED',
    "isReinitiated" BOOLEAN NOT NULL DEFAULT false,
    "reinitiatedBy" INTEGER,
    "reinitiatedAt" TIMESTAMP(3),
    "reinitiationReason" TEXT,
    "firstVerificationTimestamp" TIMESTAMP(3),
    "firstVerificationIp" TEXT,
    "firstVerificationLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanRecord" (
    "id" SERIAL NOT NULL,
    "qrCodeId" INTEGER,
    "scannedCode" TEXT NOT NULL,
    "scanOutcome" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedByRole" "Role" NOT NULL,
    "scannerId" INTEGER,
    "ipAddress" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "ScanRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" SERIAL NOT NULL,
    "targetUserId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" SERIAL NOT NULL,
    "manufacturerId" INTEGER NOT NULL,
    "distributorId" INTEGER NOT NULL,
    "pharmacyId" INTEGER NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING_PICKUP',
    "confirmationCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentItem" (
    "id" SERIAL NOT NULL,
    "shipmentId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispenseRecord" (
    "id" SERIAL NOT NULL,
    "qrCodeId" INTEGER NOT NULL,
    "pharmacyId" INTEGER NOT NULL,
    "dispensedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispenseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "pharmacyId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkincareBrand" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "brandName" TEXT NOT NULL,
    "cacNumber" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "placardQrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkincareBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkincareProduct" (
    "id" SERIAL NOT NULL,
    "brandId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "skinReactions" TEXT,
    "nafdacNumber" TEXT,
    "uniqueCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkincareProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_companyRegNumber_key" ON "User"("companyRegNumber");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_code_key" ON "QRCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_confirmationCode_key" ON "Shipment"("confirmationCode");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentItem_shipmentId_batchId_key" ON "ShipmentItem"("shipmentId", "batchId");

-- CreateIndex
CREATE UNIQUE INDEX "DispenseRecord_qrCodeId_key" ON "DispenseRecord"("qrCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SkincareBrand_userId_key" ON "SkincareBrand"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SkincareBrand_cacNumber_key" ON "SkincareBrand"("cacNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SkincareProduct_uniqueCode_key" ON "SkincareProduct"("uniqueCode");

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanRecord" ADD CONSTRAINT "ScanRecord_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanRecord" ADD CONSTRAINT "ScanRecord_scannerId_fkey" FOREIGN KEY ("scannerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispenseRecord" ADD CONSTRAINT "DispenseRecord_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispenseRecord" ADD CONSTRAINT "DispenseRecord_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkincareBrand" ADD CONSTRAINT "SkincareBrand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkincareProduct" ADD CONSTRAINT "SkincareProduct_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "SkincareBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
