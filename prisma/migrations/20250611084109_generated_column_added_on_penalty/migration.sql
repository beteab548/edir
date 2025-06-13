-- CreateEnum
CREATE TYPE "GeneratedType" AS ENUM ('automatically', 'manually');

-- AlterTable
ALTER TABLE "Penalty" ADD COLUMN     "generated" "GeneratedType" DEFAULT 'automatically';
