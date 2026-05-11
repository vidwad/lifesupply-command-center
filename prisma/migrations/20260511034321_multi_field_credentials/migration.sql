/*
  Warnings:

  - You are about to drop the column `encryptedSecret` on the `integration_connections` table. All the data in the column will be lost.
  - You are about to drop the column `secretLastFour` on the `integration_connections` table. All the data in the column will be lost.
  - You are about to drop the column `secretSetAt` on the `integration_connections` table. All the data in the column will be lost.
  - You are about to drop the column `secretSetById` on the `integration_connections` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "integration_connections" DROP CONSTRAINT "integration_connections_secretSetById_fkey";

-- AlterTable
ALTER TABLE "integration_connections" DROP COLUMN "encryptedSecret",
DROP COLUMN "secretLastFour",
DROP COLUMN "secretSetAt",
DROP COLUMN "secretSetById",
ADD COLUMN     "credentialMeta" JSONB,
ADD COLUMN     "credentials" JSONB;
