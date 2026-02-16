import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';
import { UnauthorizedError, NotFoundError, ConflictError } from '../utils/errors';
import { JwtPayload } from '../middleware/auth';
import { UserRole } from '@prisma/client';

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiresIn as string,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn as string,
    } as jwt.SignOptions);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        businessUnit: user.businessUnit,
        site: user.site,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.secret) as JwtPayload;
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      const newPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = jwt.sign(newPayload, config.jwt.secret, {
        expiresIn: config.jwt.accessExpiresIn as string,
      } as jwt.SignOptions);

      return { accessToken };
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User', userId);
    const { passwordHash: _, ...profile } = user;
    return profile;
  }

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    businessUnit?: string;
    site?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictError('Email already in use');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        businessUnit: data.businessUnit,
        site: data.site,
      },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }
}

export const authService = new AuthService();
