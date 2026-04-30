export const resetPasswordTemplate = (name: string, token: string, resetUrl: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
    .body { padding: 40px 32px; }
    .body p { color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 16px; }
    .button { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
    .token-box { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 14px; color: #2d3748; word-break: break-all; margin: 16px 0; }
    .warning { color: #e53e3e; font-size: 14px; }
    .footer { background: #f7fafc; padding: 24px 32px; text-align: center; }
    .footer p { color: #a0aec0; font-size: 14px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset 🔐</h1>
    </div>
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      <a href="${resetUrl}?token=${token}" class="button">Reset Password</a>
      <p>Or use this token directly:</p>
      <div class="token-box">${token}</div>
      <p class="warning">⚠️ This link expires in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Your App. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
