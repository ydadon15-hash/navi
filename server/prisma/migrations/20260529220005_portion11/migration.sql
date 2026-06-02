-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN "difficulty" TEXT;

-- CreateTable
CREATE TABLE "StudySession" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "studyPlanDayId" INTEGER,
    "taskId" INTEGER,
    "studiedMinutes" INTEGER NOT NULL,
    "sessionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- AlterTable: add rolledOver and movedToDate to StudyPlanTask
ALTER TABLE "StudyPlanTask" ADD COLUMN "rolledOver" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StudyPlanTask" ADD COLUMN "movedToDate" TEXT;
