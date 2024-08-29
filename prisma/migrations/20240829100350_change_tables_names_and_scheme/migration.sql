-- CreateEnum
CREATE TYPE "Measure_Type" AS ENUM ('WATER', 'GAS');

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "customer_code" VARCHAR(255) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measure" (
    "measure_uuid" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "measure_datetime" TIMESTAMP(3) NOT NULL,
    "measure_type" "Measure_Type" NOT NULL,
    "measure_value" INTEGER NOT NULL,
    "has_confirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "measure_pkey" PRIMARY KEY ("measure_uuid")
);

-- CreateTable
CREATE TABLE "images" (
    "id" SERIAL NOT NULL,
    "guid" TEXT NOT NULL,
    "reading_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_id_key" ON "customers"("id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customer_code_key" ON "customers"("customer_code");

-- CreateIndex
CREATE UNIQUE INDEX "measure_measure_uuid_key" ON "measure"("measure_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "images_id_key" ON "images"("id");

-- AddForeignKey
ALTER TABLE "measure" ADD CONSTRAINT "measure_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "measure"("measure_uuid") ON DELETE CASCADE ON UPDATE CASCADE;
