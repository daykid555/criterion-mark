/*
  Warnings:

  - A unique constraint covering the columns `[companyRegNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "companyRegNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_companyRegNumber_key" ON "User"("companyRegNumber");
