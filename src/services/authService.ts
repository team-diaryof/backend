import { v4 as uuidv4 } from "uuid";
import prisma from "../prisma/client";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { User, Role } from "@prisma/client";
import { env } from "../config/env";

export class AuthService {
  async register(
    email: string,
    password: string,
    name?: string
  ): Promise<string> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: Role.USER },
    });
    return this.generateToken(user);
  }

  async login(email: string, password: string): Promise<string | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password || ""))) {
      return this.generateToken(user);
    }
    return null;
  }

  async guestLogin(): Promise<string> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry
    const user = await prisma.user.create({
      data: {
        email: `guest_${uuidv4()}@example.com`,
        role: Role.GUEST,
        expiresAt,
        name: `Guest_${uuidv4().slice(0, 8)}`,
      },
    });
    return this.generateToken(user, "15m");
  }

  private generateToken(user: User, expiresIn: string = "1h"): string {
    return jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: expiresIn as any,
    });
  }
}

export default new AuthService();
