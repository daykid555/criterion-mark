-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'MANUFACTURER', 'DVA', 'CUSTOMER', 'PRINTING', 'LOGISTICS', 'LOGISTICS_DISTRIBUTOR', 'PHARMACY', 'SKINCARE_BRAND', 'HEALTH_ADVISOR');

-- CreateEnum
CREATE TYPE "public"."BatchStatus" AS ENUM ('PENDING_DVA_APPROVAL', 'PENDING_ADMIN_APPROVAL', 'ADMIN_REJECTED', 'DVA_REJECTED', 'PENDING_PRINTING', 'PRINTING_COMPLETE', 'READY_FOR_SEALING', 'READY_FOR_SHIPPING', 'DELIVERED', 'ON_HOLD', 'CANCELLED', 'PRINTING_IN_PROGRESS', 'IN_TRANSIT', 'PENDING_MANUFACTURER_CONFIRMATION');

-- CreateEnum
CREATE TYPE "public"."QRCodeStatus" AS ENUM ('UNUSED', 'AWAITING_ASSIGNMENT', 'ASSIGNED_TO_MASTER', 'VERIFIED_BY_SUPPLY_CHAIN', 'SEALED', 'VERIFIED_ONCE', 'FLAGGED', 'INVALID_STATE', 'USED');

-- CreateEnum
CREATE TYPE "public"."ShipmentStatus" AS ENUM ('PENDING_PICKUP', 'IN_TRANSIT', 'AWAITING_VERIFICATION', 'DELIVERED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('NEW', 'IN_REVIEW', 'FORWARDED', 'FORWARDED_TO_STORE', 'RESOLVED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "companyName" TEXT,
    "companyRegNumber" TEXT,
    "role" "public"."Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "settings" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Batch" (
    "id" SERIAL NOT NULL,
    "drugName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "nafdacNumber" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "manufacturerId" INTEGER NOT NULL,
    "status" "public"."BatchStatus" NOT NULL DEFAULT 'PENDING_DVA_APPROVAL',
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
    "productInstructionVideoUrl" TEXT,
    "productInstructionText" TEXT,
    "productSealImageUrl" TEXT,
    "dvaApproverId" INTEGER,
    "adminApproverId" INTEGER,
    "rejectedById" INTEGER,
    "printingStartedById" INTEGER,
    "printingCompletedById" INTEGER,
    "pickedUpById" INTEGER,
    "finalizedDeliveryById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "delivery_notes" TEXT,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QRCode" (
    "id" SERIAL NOT NULL,
    "innerCode" TEXT NOT NULL,
    "outerCode" TEXT NOT NULL,
    "smsCode" TEXT,
    "batchId" INTEGER NOT NULL,
    "status" "public"."QRCodeStatus" NOT NULL DEFAULT 'AWAITING_ASSIGNMENT',
    "isMaster" BOOLEAN NOT NULL DEFAULT false,
    "parentId" INTEGER,
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
CREATE TABLE "public"."ScanRecord" (
    "id" SERIAL NOT NULL,
    "qrCodeId" INTEGER,
    "scannedCode" TEXT NOT NULL,
    "scanOutcome" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedByRole" "public"."Role" NOT NULL,
    "scannerId" INTEGER,
    "ipAddress" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "fullAddress" TEXT,

    CONSTRAINT "ScanRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationLog" (
    "id" SERIAL NOT NULL,
    "targetUserId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Shipment" (
    "id" SERIAL NOT NULL,
    "manufacturerId" INTEGER NOT NULL,
    "distributorId" INTEGER NOT NULL,
    "pharmacyId" INTEGER NOT NULL,
    "status" "public"."ShipmentStatus" NOT NULL DEFAULT 'PENDING_PICKUP',
    "confirmationCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShipmentItem" (
    "id" SERIAL NOT NULL,
    "shipmentId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DispenseRecord" (
    "id" SERIAL NOT NULL,
    "qrCodeId" INTEGER NOT NULL,
    "pharmacyId" INTEGER NOT NULL,
    "dispensedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispenseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "productName" TEXT NOT NULL,
    "qrCode" TEXT,
    "issueDescription" TEXT NOT NULL,
    "attachments" TEXT[],
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'NEW',
    "assigneeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Communication" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SkincareBrand" (
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
CREATE TABLE "public"."SkincareProduct" (
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

-- CreateTable
CREATE TABLE "public"."HealthVideo" (
    "id" SERIAL NOT NULL,
    "nafdacNumber" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "genuineVideoUrl" TEXT NOT NULL,
    "counterfeitVideoUrl" TEXT NOT NULL,
    "genuineText" TEXT NOT NULL DEFAULT '',
    "counterfeitText" TEXT NOT NULL DEFAULT '',
    "uploaderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthVideo_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_companyRegNumber_key" ON "public"."User"("companyRegNumber");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_innerCode_key" ON "public"."QRCode"("innerCode");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_outerCode_key" ON "public"."QRCode"("outerCode");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_smsCode_key" ON "public"."QRCode"("smsCode");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_confirmationCode_key" ON "public"."Shipment"("confirmationCode");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentItem_shipmentId_batchId_key" ON "public"."ShipmentItem"("shipmentId", "batchId");

-- CreateIndex
CREATE UNIQUE INDEX "DispenseRecord_qrCodeId_key" ON "public"."DispenseRecord"("qrCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "public"."SystemSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SkincareBrand_userId_key" ON "public"."SkincareBrand"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SkincareBrand_cacNumber_key" ON "public"."SkincareBrand"("cacNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SkincareProduct_uniqueCode_key" ON "public"."SkincareProduct"("uniqueCode");

-- CreateIndex
CREATE UNIQUE INDEX "HealthVideo_nafdacNumber_key" ON "public"."HealthVideo"("nafdacNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CounterfeitContent_qrCode_key" ON "public"."CounterfeitContent"("qrCode");

-- AddForeignKey
ALTER TABLE "public"."Batch" ADD CONSTRAINT "Batch_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Batch" ADD CONSTRAINT "Batch_dvaApproverId_fkey" FOREIGN KEY ("dvaApproverId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Batch" ADD CONSTRAINT "Batch_adminApproverId_fkey" FOREIGN KEY ("adminApproverId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Batch" ADD CONSTRAINT "Batch_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Batch" ADD CONSTRAINT "Batch_printingStartedById_fkey" FOREIGN KEY ("printingStartedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Batch" ADD CONSTRAINT "Batch_printingCompletedById_fkey" FOREIGN KEY ("printingCompletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Batch" ADD CONSTRAINT "Batch_pickedUpById_fkey" FOREIGN KEY ("pickedUpById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Batch" ADD CONSTRAINT "Batch_finalizedDeliveryById_fkey" FOREIGN KEY ("finalizedDeliveryById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRCode" ADD CONSTRAINT "QRCode_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRCode" ADD CONSTRAINT "QRCode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."QRCode"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ScanRecord" ADD CONSTRAINT "ScanRecord_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "public"."QRCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScanRecord" ADD CONSTRAINT "ScanRecord_scannerId_fkey" FOREIGN KEY ("scannerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationLog" ADD CONSTRAINT "NotificationLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "public"."Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentItem" ADD CONSTRAINT "ShipmentItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DispenseRecord" ADD CONSTRAINT "DispenseRecord_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "public"."QRCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DispenseRecord" ADD CONSTRAINT "DispenseRecord_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Communication" ADD CONSTRAINT "Communication_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SkincareBrand" ADD CONSTRAINT "SkincareBrand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SkincareProduct" ADD CONSTRAINT "SkincareProduct_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."SkincareBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HealthVideo" ADD CONSTRAINT "HealthVideo_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
