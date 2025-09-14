-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "finalizedDeliveryById" INTEGER,
ADD COLUMN     "pickedUpById" INTEGER,
ADD COLUMN     "printingCompletedById" INTEGER,
ADD COLUMN     "printingStartedById" INTEGER;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_printingStartedById_fkey" FOREIGN KEY ("printingStartedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_printingCompletedById_fkey" FOREIGN KEY ("printingCompletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_pickedUpById_fkey" FOREIGN KEY ("pickedUpById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_finalizedDeliveryById_fkey" FOREIGN KEY ("finalizedDeliveryById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
