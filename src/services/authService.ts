import { v4 as uuidv4 } from "uuid";
import prisma from "../prisma/client";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { User, Role } from "@prisma/client";
import { env } from "../config/env";
import {
  otpEmailTemplate,
  passwordResetOtpEmailTemplate,
} from "../utils/emailTemplates";
import logger from "../utils/logger";

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    createdAt: Date;
  };
}

export class AuthService {
  private readonly TEMP_ROLE = "TEMP" as unknown as Role;
  // Send registration OTP to the user
  async sendRegistrationOtp(
    email: string,
    password: string,
    name?: string
  ): Promise<{ message: string }> {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && (existingUser.role as any) !== this.TEMP_ROLE) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create or update a TEMP user so the VerificationToken can reference userId
    const tempUser = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            password: hashedPassword,
            role: this.TEMP_ROLE,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        })
      : await prisma.user.create({
          data: {
            email,
            name,
            password: hashedPassword,
            role: this.TEMP_ROLE,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save verification token to database
    const vt = (prisma as any).verificationToken;

    // Delete any existing verification token for this user
    await vt.deleteMany({
      where: { userId: tempUser.id },
    });

    // Create new verification token
    await vt.create({
      data: {
        id: uuidv4(),
        identifier: email,
        token: otp,
        expiresAt,
        userId: tempUser.id,
      },
    });

    // Send email using new API format
    const htmlContent = otpEmailTemplate(otp, name);
    const apiUrl = "https://diaryof.vercel.app/api/v1/send-email";
    const headers = {
      "Content-Type": "application/json",
      // Try standard Authorization header first, fallback to custom header
      // Authorization: `Bearer ${env.EMAIL_API_SECRET}`,
      "authorization-token": env.EMAIL_API_SECRET,
    };
    const requestBody = {
      to: email,
      subject: "DiaryOf - Verify Your Email",
      html: htmlContent,
    };

    logger.info("Sending email request", {
      url: apiUrl,
      headers: { ...headers, "authorization-token": "[REDACTED]" },
      body: { ...requestBody, html: "[REDACTED]" },
    });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const status = response.status;
      const responseHeaders = Object.fromEntries(response.headers.entries());

      logger.error("Email API request failed", {
        status,
        statusText: response.statusText,
        responseBody: text,
        responseHeaders,
      });

      const errorMessage = text || `HTTP ${status}: Failed to send OTP`;
      throw new Error(errorMessage);
    }

    // Success determined by HTTP 200; ignore external response body
    return { message: "OTP sent successfully" };
  }

  // Resend OTP to the user (sends the same OTP again)
  async resendOtp(email: string): Promise<{ message: string }> {
    const vt = (prisma as any).verificationToken;

    // Find the existing verification token for this email
    const tokenRecord = await vt.findFirst({
      where: {
        identifier: email,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new Error("No valid OTP found. Please request a new OTP.");
    }

    // Find the TEMP user to get the name
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || (user.role as any) !== this.TEMP_ROLE) {
      throw new Error("Registration session not found");
    }

    // Get the existing OTP from the token record
    const otp = tokenRecord.token;

    // Send email using new API format
    const htmlContent = otpEmailTemplate(otp, user.name || undefined);
    const apiUrl = "https://diaryof.vercel.app/api/v1/send-email";
    const headers = {
      "Content-Type": "application/json",
      "authorization-token": env.EMAIL_API_SECRET,
    };
    const requestBody = {
      to: email,
      subject: "DiaryOf - Verify Your Email",
      html: htmlContent,
    };

    logger.info("Resending OTP email request", {
      url: apiUrl,
      headers: { ...headers, "authorization-token": "[REDACTED]" },
      body: { ...requestBody, html: "[REDACTED]" },
    });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const status = response.status;
      const responseHeaders = Object.fromEntries(response.headers.entries());

      logger.error("Email API request failed", {
        status,
        statusText: response.statusText,
        responseBody: text,
        responseHeaders,
      });

      const errorMessage = text || `HTTP ${status}: Failed to resend OTP`;
      throw new Error(errorMessage);
    }

    return { message: "OTP resent successfully" };
  }

  // Verify OTP and register user
  async verifyOtpAndRegister(
    email: string,
    otp: string
  ): Promise<AuthResponse> {
    // Verify OTP via VerificationToken table
    const vt = (prisma as any).verificationToken;
    const tokenRecord = await vt.findFirst({
      where: {
        identifier: email,
        token: otp,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new Error("Invalid or expired OTP");
    }

    // Find the TEMP user created during OTP send
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await vt.delete({ where: { id: tokenRecord.id } });
      throw new Error("Registration session not found");
    }

    // Promote to USER; data (name/password) already stored on TEMP user
    const updateData: any = {
      role: Role.USER,
      expiresAt: null,
      name: user.name,
    };

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Invalidate the OTP after successful registration
    await vt.delete({ where: { id: tokenRecord.id } });

    return {
      token: this.generateToken(updatedUser),
      user: this.sanitizeUser(updatedUser),
    };
  }

  async login(email: string, password: string): Promise<AuthResponse | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password || ""))) {
      return {
        token: this.generateToken(user),
        user: this.sanitizeUser(user),
      };
    }
    return null;
  }

  // Send password reset OTP to the user
  async sendPasswordResetOtp(email: string): Promise<{ message: string }> {
    // Check if user exists and is a registered user (not TEMP or GUEST)
    const user = await prisma.user.findUnique({ where: { email } });

    // Security: Don't reveal if user exists or not
    // Return success message even if user doesn't exist or can't reset password
    if (!user) {
      return {
        message:
          "If an account exists with this email, a password reset OTP has been sent.",
      };
    }

    // Only allow password reset for registered users (not TEMP, GUEST)
    if ((user.role as any) === this.TEMP_ROLE || user.role === Role.GUEST) {
      return {
        message:
          "If an account exists with this email, a password reset OTP has been sent.",
      };
    }

    // Check if user has a password (not OAuth-only users)
    if (!user.password) {
      return {
        message:
          "If an account exists with this email, a password reset OTP has been sent.",
      };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save verification token to database
    const vt = (prisma as any).verificationToken;

    // Delete any existing verification token for this user
    await vt.deleteMany({
      where: { userId: user.id },
    });

    // Create new verification token for password reset
    await vt.create({
      data: {
        id: uuidv4(),
        identifier: email,
        token: otp,
        expiresAt,
        userId: user.id,
      },
    });

    // Send email using new API format
    const htmlContent = passwordResetOtpEmailTemplate(
      otp,
      user.name || undefined
    );
    const apiUrl = "https://diaryof.vercel.app/api/v1/send-email";
    const headers = {
      "Content-Type": "application/json",
      "authorization-token": env.EMAIL_API_SECRET,
    };
    const requestBody = {
      to: email,
      subject: "DiaryOf - Password Reset",
      html: htmlContent,
    };

    logger.info("Sending password reset OTP email request", {
      url: apiUrl,
      headers: { ...headers, "authorization-token": "[REDACTED]" },
      body: { ...requestBody, html: "[REDACTED]" },
    });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const status = response.status;
      const responseHeaders = Object.fromEntries(response.headers.entries());

      logger.error("Email API request failed", {
        status,
        statusText: response.statusText,
        responseBody: text,
        responseHeaders,
      });

      const errorMessage =
        text || `HTTP ${status}: Failed to send password reset OTP`;
      throw new Error(errorMessage);
    }

    // Return generic message for security (don't reveal if user exists)
    return {
      message:
        "If an account exists with this email, a password reset OTP has been sent.",
    };
  }

  // Verify password reset OTP (step 1: just verify OTP)
  async verifyPasswordResetOtp(
    email: string,
    otp: string
  ): Promise<{ message: string }> {
    const vt = (prisma as any).verificationToken;

    // Verify OTP via VerificationToken table
    const tokenRecord = await vt.findFirst({
      where: {
        identifier: email,
        token: otp,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new Error("Invalid or expired OTP");
    }

    // Find the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await vt.delete({ where: { id: tokenRecord.id } });
      throw new Error("User not found");
    }

    // Verify this is for password reset (user should be registered, not TEMP)
    if ((user.role as any) === this.TEMP_ROLE) {
      await vt.delete({ where: { id: tokenRecord.id } });
      throw new Error(
        "Invalid OTP. Please use the registration verification flow."
      );
    }

    // Delete the OTP token
    await vt.delete({ where: { id: tokenRecord.id } });

    // Create a password reset session token (valid for 5 minutes)
    const resetToken = uuidv4();
    const resetExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await vt.create({
      data: {
        id: uuidv4(),
        identifier: email,
        token: resetToken,
        expiresAt: resetExpiresAt,
        userId: user.id,
      },
    });

    return {
      message: "OTP verified successfully. You can now reset your password.",
    };
  }

  // Reset password (step 2: reset password after OTP verification)
  async resetPassword(
    email: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const vt = (prisma as any).verificationToken;

    // Find a valid password reset session token
    // We look for any token that's not a 6-digit OTP (OTPs are numeric, reset tokens are UUIDs)
    const resetTokenRecord = await vt.findFirst({
      where: {
        identifier: email,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetTokenRecord) {
      throw new Error(
        "No valid password reset session found. Please verify your OTP first."
      );
    }

    // Check if it's a reset token (UUID format, not 6-digit OTP)
    const isResetToken = resetTokenRecord.token.length > 10;
    if (!isResetToken) {
      throw new Error(
        "No valid password reset session found. Please verify your OTP first."
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await vt.delete({ where: { id: resetTokenRecord.id } });
      throw new Error("User not found");
    }

    // Verify this is for password reset (user should be registered, not TEMP)
    if ((user.role as any) === this.TEMP_ROLE) {
      await vt.delete({ where: { id: resetTokenRecord.id } });
      throw new Error("Invalid reset session");
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    // Invalidate the reset token after successful password reset
    await vt.delete({ where: { id: resetTokenRecord.id } });

    return { message: "Password reset successfully" };
  }

  async guestLogin(): Promise<AuthResponse> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry
    const user = await prisma.user.create({
      data: {
        email: `guest_${uuidv4()}@example.com`,
        role: Role.GUEST,
        expiresAt,
        name: `Guest_${uuidv4().slice(0, 8)}`,
        googleId: `guest_${uuidv4()}`, // Provide unique googleId for guests
      },
    });
    return {
      token: this.generateToken(user, "15m"),
      user: this.sanitizeUser(user),
    };
  }

  private generateToken(user: User, expiresIn: string = "1h"): string {
    // Token only contains minimal fields needed for authentication/authorization:
    // - id: to identify the user
    // - role: for authorization checks
    // Note: password and googleId are excluded as they're not needed in tokens
    // (password should never be in tokens, googleId is only used for OAuth lookup)
    return jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: expiresIn as any,
    });
  }

  private sanitizeUser(user: User): {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    createdAt: Date;
  } {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}

export default new AuthService();
