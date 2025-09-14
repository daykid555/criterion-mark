/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `isResolved` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `pharmacyId` on the `Report` table. All the data in the column will be lost.
  - Added the required column `issueDescription` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productName` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('NEW', 'IN_REVIEW', 'FORWARDED', 'RESOLVED');

-- DropForeignKey
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_pharmacyId_fkey";

-- AlterTable
ALTER TABLE "public"."Report" DROP COLUMN "imageUrl",
DROP COLUMN "isResolved",
DROP COLUMN "message",
DROP COLUMN "pharmacyId",
ADD COLUMN     "assigneeId" INTEGER,
ADD COLUMN     "attachments" TEXT[],
ADD COLUMN     "issueDescription" TEXT NOT NULL,
ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "qrCode" TEXT,
ADD COLUMN     "status" "public"."ReportStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
