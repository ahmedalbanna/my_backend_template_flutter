-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_otpHash_otpExpiresAt_idx" ON "User"("otpHash", "otpExpiresAt");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_passwordResetExpires_idx" ON "User"("passwordResetExpires");
