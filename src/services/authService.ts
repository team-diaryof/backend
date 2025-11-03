import { v4 as uuidv4 } from "uuid";
import prisma from "../prisma/client";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { User, Role } from "@prisma/client";
import { env } from "../config/env";

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

    const response = await fetch(
      "https://diaryof.vercel.app/api/auth/register/send-otp",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || "Failed to send OTP");
    }

    // Success determined by HTTP 200; ignore external response body
    return { message: "OTP sent successfully" };
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
