/*
  Warnings:

  - You are about to drop the column `code` on the `QRCode` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[innerCode]` on the table `QRCode` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[outerCode]` on the table `QRCode` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[smsCode]` on the table `QRCode` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `innerCode` to the `QRCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outerCode` to the `QRCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QRCodeStatus" ADD VALUE 'AWAITING_ASSIGNMENT';
ALTER TYPE "QRCodeStatus" ADD VALUE 'ASSIGNED_TO_MASTER';
ALTER TYPE "QRCodeStatus" ADD VALUE 'VERIFIED_BY_SUPPLY_CHAIN';

-- DropIndex
DROP INDEX "QRCode_code_key";

-- AlterTable
ALTER TABLE "QRCode" DROP COLUMN "code",
ADD COLUMN     "innerCode" TEXT NOT NULL,
ADD COLUMN     "outerCode" TEXT NOT NULL,
ADD COLUMN     "smsCode" TEXT,
ALTER COLUMN "status" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_innerCode_key" ON "QRCode"("innerCode");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_outerCode_key" ON "QRCode"("outerCode");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_smsCode_key" ON "QRCode"("smsCode");
