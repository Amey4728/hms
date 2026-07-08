-- CreateEnum
CREATE TYPE "SpecimenType" AS ENUM ('BLOOD', 'URINE', 'STOOL', 'SWAB', 'TISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "LabOrderStatus" AS ENUM ('ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LabResultFlag" AS ENUM ('NORMAL', 'LOW', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "lab_tests" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "specimenType" "SpecimenType" NOT NULL DEFAULT 'BLOOD',
    "unit" TEXT,
    "referenceRange" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hospitalId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" UUID,
    "updatedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_orders" (
    "id" UUID NOT NULL,
    "orderNumber" SERIAL NOT NULL,
    "patientId" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "orderedById" UUID,
    "status" "LabOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "notes" TEXT,
    "sampleCollectedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" UUID,
    "updatedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_order_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "testId" UUID NOT NULL,
    "resultValue" TEXT,
    "unit" TEXT,
    "flag" "LabResultFlag",
    "resultNotes" TEXT,
    "resultedAt" TIMESTAMP(3),
    "resultedById" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_tests_code_key" ON "lab_tests"("code");

-- CreateIndex
CREATE INDEX "lab_tests_category_idx" ON "lab_tests"("category");

-- CreateIndex
CREATE INDEX "lab_tests_deletedAt_idx" ON "lab_tests"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "lab_orders_orderNumber_key" ON "lab_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "lab_orders_patientId_idx" ON "lab_orders"("patientId");

-- CreateIndex
CREATE INDEX "lab_orders_status_idx" ON "lab_orders"("status");

-- CreateIndex
CREATE INDEX "lab_orders_deletedAt_idx" ON "lab_orders"("deletedAt");

-- CreateIndex
CREATE INDEX "lab_order_items_testId_idx" ON "lab_order_items"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "lab_order_items_orderId_testId_key" ON "lab_order_items"("orderId", "testId");

-- AddForeignKey
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_orderedById_fkey" FOREIGN KEY ("orderedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_testId_fkey" FOREIGN KEY ("testId") REFERENCES "lab_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
