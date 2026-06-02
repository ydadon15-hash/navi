-- AlterTable: add sharing, notification, and Stripe fields to User
ALTER TABLE "User" ADD COLUMN "shareToken" TEXT;
ALTER TABLE "User" ADD COLUMN "sharingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "notificationPreferences" TEXT;
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN "stripeSubscriptionId" TEXT;
