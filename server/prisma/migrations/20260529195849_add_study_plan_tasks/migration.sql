-- CreateTable
CREATE TABLE "StudyPlanTask" (
    "id" SERIAL PRIMARY KEY,
    "studyPlanDayId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyPlanTask_studyPlanDayId_fkey" FOREIGN KEY ("studyPlanDayId") REFERENCES "StudyPlanDay" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- AlterTable: drop old tasks column, add createdAt to StudyPlanDay
ALTER TABLE "StudyPlanDay" DROP COLUMN "tasks";
ALTER TABLE "StudyPlanDay" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
