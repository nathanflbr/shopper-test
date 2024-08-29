/*
  Warnings:

  - You are about to drop the column `reading_id` on the `images` table. All the data in the column will be lost.
  - Added the required column `measure_id` to the `images` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "images" DROP CONSTRAINT "images_reading_id_fkey";

-- AlterTable
ALTER TABLE "images" DROP COLUMN "reading_id",
ADD COLUMN     "measure_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_measure_id_fkey" FOREIGN KEY ("measure_id") REFERENCES "measure"("measure_uuid") ON DELETE CASCADE ON UPDATE CASCADE;
