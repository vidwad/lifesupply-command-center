-- AlterTable
ALTER TABLE "integration_connections" ADD COLUMN     "encryptedSecret" TEXT,
ADD COLUMN     "secretLastFour" TEXT,
ADD COLUMN     "secretSetAt" TIMESTAMP(3),
ADD COLUMN     "secretSetById" TEXT;

-- AddForeignKey
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_secretSetById_fkey" FOREIGN KEY ("secretSetById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
