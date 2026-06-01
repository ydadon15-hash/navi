-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isStudent" BOOLEAN NOT NULL,
    "schoolName" TEXT,
    "canvasToken" TEXT,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "trialStartDate" DATETIME,
    "lastSyncedAt" DATETIME,
    "shareToken" TEXT,
    "sharingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notificationPreferences" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT
);
INSERT INTO "new_User" ("canvasToken", "createdAt", "email", "id", "isStudent", "lastSyncedAt", "name", "onboardingComplete", "password", "schoolName", "subscriptionTier", "trialStartDate") SELECT "canvasToken", "createdAt", "email", "id", "isStudent", "lastSyncedAt", "name", "onboardingComplete", "password", "schoolName", "subscriptionTier", "trialStartDate" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
