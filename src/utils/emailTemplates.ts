export const otpEmailTemplate = (otp: string, userName?: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        .header { text-align: center; color: #333; }
        .otp-box { background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="header">DiaryOf - Verify Your Email</h1>
        ${userName ? `<p>Hello ${userName},</p>` : "<p>Hello,</p>"}
        <p>Your OTP for email verification is:</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <div class="footer">
          <p>© 2025 DiaryOf. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const passwordResetOtpEmailTemplate = (
  otp: string,
  userName?: string
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        .header { text-align: center; color: #333; }
        .otp-box { background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 5px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="header">DiaryOf - Password Reset</h1>
        ${userName ? `<p>Hello ${userName},</p>` : "<p>Hello,</p>"}
        <p>We received a request to reset your password. Your OTP for password reset is:</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
        <div class="warning">
          <p><strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>© 2025 DiaryOf. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const welcomeEmailTemplate = (userName: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <body>
      <h1>Welcome to DiaryOf, ${userName}!</h1>
      <p>Thank you for joining us.</p>
    </body>
    </html>
  `;
};
