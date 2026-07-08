-- CreateEnum
CREATE TYPE "RadiologyModality" AS ENUM ('XRAY', 'MRI', 'CT', 'ULTRASOUND', 'MAMMOGRAPHY', 'OTHER');

-- CreateEnum
CREATE TYPE "RadiologyStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'PERFORMED', 'REPORTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "radiology_exams" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modality" "RadiologyModality" NOT NULL DEFAULT 'XRAY',
    "bodyPart" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hospitalId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" UUID,
    "updatedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "radiology_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiology_studies" (
    "id" UUID NOT NULL,
    "studyNumber" SERIAL NOT NULL,
    "patientId" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "referredById" UUID,
    "radiologistId" UUID,
    "status" "RadiologyStatus" NOT NULL DEFAULT 'REQUESTED',
    "scheduledAt" TIMESTAMP(3),
    "performedAt" TIMESTAMP(3),
    "reportedAt" TIMESTAMP(3),
    "findings" TEXT,
    "impression" TEXT,
    "imageUrl" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" UUID,
    "updatedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "radiology_studies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "radiology_exams_code_key" ON "radiology_exams"("code");

-- CreateIndex
CREATE INDEX "radiology_exams_modality_idx" ON "radiology_exams"("modality");

-- CreateIndex
CREATE INDEX "radiology_exams_deletedAt_idx" ON "radiology_exams"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "radiology_studies_studyNumber_key" ON "radiology_studies"("studyNumber");

-- CreateIndex
CREATE INDEX "radiology_studies_patientId_idx" ON "radiology_studies"("patientId");

-- CreateIndex
CREATE INDEX "radiology_studies_status_idx" ON "radiology_studies"("status");

-- CreateIndex
CREATE INDEX "radiology_studies_deletedAt_idx" ON "radiology_studies"("deletedAt");

-- AddForeignKey
ALTER TABLE "radiology_exams" ADD CONSTRAINT "radiology_exams_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_studies" ADD CONSTRAINT "radiology_studies_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_studies" ADD CONSTRAINT "radiology_studies_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_studies" ADD CONSTRAINT "radiology_studies_examId_fkey" FOREIGN KEY ("examId") REFERENCES "radiology_exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
