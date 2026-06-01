/*
  Warnings:

  - You are about to drop the column `tasks` on the `StudyPlanDay` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "StudyPlanTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studyPlanDayId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyPlanTask_studyPlanDayId_fkey" FOREIGN KEY ("studyPlanDayId") REFERENCES "StudyPlanDay" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudyPlanDay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyPlanDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StudyPlanDay" ("date", "id", "userId") SELECT "date", "id", "userId" FROM "StudyPlanDay";
DROP TABLE "StudyPlanDay";
ALTER TABLE "new_StudyPlanDay" RENAME TO "StudyPlanDay";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
