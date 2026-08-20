/*
  Warnings:

  - Added the required column `slotDuration` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workEndTime` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workStartTime` to the `Doctor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "slotDuration" INTEGER NOT NULL,
ADD COLUMN     "workEndTime" TEXT NOT NULL,
ADD COLUMN     "workStartTime" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "DoctorLeave" (
    "id" SERIAL NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "leaveDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "DoctorLeave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorLeave_doctorId_leaveDate_key" ON "DoctorLeave"("doctorId", "leaveDate");

-- AddForeignKey
ALTER TABLE "DoctorLeave" ADD CONSTRAINT "DoctorLeave_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
