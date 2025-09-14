-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'HEALTH_ADVISOR';

-- CreateTable
CREATE TABLE "HealthVideo" (
    "id" SERIAL NOT NULL,
    "nafdacNumber" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "genuineVideoUrl" TEXT NOT NULL,
    "counterfeitVideoUrl" TEXT NOT NULL,
    "uploaderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HealthVideo_nafdacNumber_key" ON "HealthVideo"("nafdacNumber");

-- AddForeignKey
ALTER TABLE "HealthVideo" ADD CONSTRAINT "HealthVideo_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
