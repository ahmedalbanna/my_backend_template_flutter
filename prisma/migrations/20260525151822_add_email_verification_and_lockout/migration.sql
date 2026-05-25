-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "fcmToken" TEXT,
    "otpHash" TEXT,
    "otpExpiresAt" DATETIME,
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "emailVerified" DATETIME,
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" DATETIME,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "fcmToken", "firstName", "id", "isActive", "lastName", "otpExpiresAt", "otpHash", "password", "passwordResetExpires", "passwordResetToken", "phone", "refreshToken", "role", "updatedAt") SELECT "createdAt", "email", "fcmToken", "firstName", "id", "isActive", "lastName", "otpExpiresAt", "otpHash", "password", "passwordResetExpires", "passwordResetToken", "phone", "refreshToken", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_otpHash_otpExpiresAt_idx" ON "User"("otpHash", "otpExpiresAt");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
CREATE INDEX "User_passwordResetExpires_idx" ON "User"("passwordResetExpires");
CREATE INDEX "User_emailVerificationToken_emailVerificationExpires_idx" ON "User"("emailVerificationToken", "emailVerificationExpires");
CREATE INDEX "User_loginAttempts_lockUntil_idx" ON "User"("loginAttempts", "lockUntil");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
