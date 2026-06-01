-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN "difficulty" TEXT;

-- CreateTable
CREATE TABLE "StudySession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "studyPlanDayId" INTEGER,
    "taskId" INTEGER,
    "studiedMinutes" INTEGER NOT NULL,
    "sessionType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudyPlanTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studyPlanDayId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "rolledOver" BOOLEAN NOT NULL DEFAULT false,
    "movedToDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyPlanTask_studyPlanDayId_fkey" FOREIGN KEY ("studyPlanDayId") REFERENCES "StudyPlanDay" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StudyPlanTask" ("classId", "createdAt", "description", "estimatedMinutes", "id", "isCompleted", "studyPlanDayId") SELECT "classId", "createdAt", "description", "estimatedMinutes", "id", "isCompleted", "studyPlanDayId" FROM "StudyPlanTask";
DROP TABLE "StudyPlanTask";
ALTER TABLE "new_StudyPlanTask" RENAME TO "StudyPlanTask";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
