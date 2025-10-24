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
  async register(
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResponse> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: Role.USER },
    });
    return {
      token: this.generateToken(user),
      user: this.sanitizeUser(user),
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
