-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isStudent" BOOLEAN NOT NULL,
    "schoolName" TEXT,
    "canvasToken" TEXT,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "trialStartDate" TIMESTAMP(3)
);

-- CreateTable
CREATE TABLE "Class" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "colorIndex" INTEGER NOT NULL,
    "canvasCourseId" TEXT,
    "currentGrade" DOUBLE PRECISION,
    "letterGrade" TEXT,
    CONSTRAINT "Class_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL PRIMARY KEY,
    "classId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "canvasAssignmentId" TEXT,
    "pointsPossible" DOUBLE PRECISION,
    "pointsEarned" DOUBLE PRECISION,
    "note" TEXT,
    CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Syllabus" (
    "id" SERIAL PRIMARY KEY,
    "classId" INTEGER NOT NULL,
    "rawText" TEXT NOT NULL,
    "summarizedJSON" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Syllabus_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyPlanDay" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "tasks" TEXT NOT NULL,
    CONSTRAINT "StudyPlanDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
