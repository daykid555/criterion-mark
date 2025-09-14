-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "adminApproverId" INTEGER,
ADD COLUMN     "dvaApproverId" INTEGER,
ADD COLUMN     "rejectedById" INTEGER;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_dvaApproverId_fkey" FOREIGN KEY ("dvaApproverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_adminApproverId_fkey" FOREIGN KEY ("adminApproverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
