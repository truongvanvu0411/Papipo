import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import type { User, UserProfile, UserRole } from '@prisma/client';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto.js';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';

type AuthUser = User & { profile: UserProfile | null };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: dto.name || dto.preferredLanguage
          ? {
              create: {
                name: dto.name ?? null,
                preferredLanguage: dto.preferredLanguage ?? 'ja'
              }
            }
          : undefined
      },
      include: {
        profile: true
      }
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto, expectedRole?: UserRole) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matches = await compare(dto.password, user.passwordHash);

    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Account is suspended');
    }

    if (expectedRole && user.role !== expectedRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(dto: RefreshTokenDto) {
    const tokenHash = this.hashOpaqueToken(dto.refreshToken);
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: { profile: true }
        }
      }
    });

    if (!refreshToken || refreshToken.revokedAt || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    if (refreshToken.user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Account is suspended');
    }

    await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revokedAt: new Date() }
    });

    return this.buildAuthResponse(refreshToken.user);
  }

  async logout(dto: RefreshTokenDto) {
    const tokenHash = this.hashOpaqueToken(dto.refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
    return { success: true };
  }

  async requestPasswordReset(dto: PasswordResetRequestDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { success: true };
    }

    const rawToken = randomBytes(24).toString('hex');
    const tokenHash = this.hashOpaqueToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    console.log(`[Papipo] Password reset token for ${email}: ${rawToken}`);

    return {
      success: true,
      resetToken: rawToken
    };
  }

  async confirmPasswordReset(dto: PasswordResetConfirmDto) {
    const tokenHash = this.hashOpaqueToken(dto.token);
    const passwordReset = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!passwordReset || passwordReset.usedAt || passwordReset.expiresAt < new Date()) {
      throw new UnauthorizedException('Reset token is invalid');
    }

    const passwordHash = await hash(dto.password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: passwordReset.userId },
        data: { passwordHash }
      }),
      this.prisma.passwordResetToken.update({
        where: { id: passwordReset.id },
        data: { usedAt: new Date() }
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          userId: passwordReset.userId,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      })
    ]);

    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true }
    });
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.profile
        ? {
            name: user.profile.name,
            preferredLanguage: user.profile.preferredLanguage,
            isOnboarded: user.profile.isOnboarded
          }
        : null
    };
  }

  private async buildAuthResponse(user: AuthUser) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    } as const;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_TTL', '15m') as never
    });
    const rawRefreshToken = randomBytes(32).toString('hex');
    const refreshTtl = this.configService.get<string>('JWT_REFRESH_TTL', '30d');
    const refreshExpiresAt = this.resolveRefreshExpiry(refreshTtl);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashOpaqueToken(rawRefreshToken),
        expiresAt: refreshExpiresAt
      }
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile
          ? {
              name: user.profile.name,
              preferredLanguage: user.profile.preferredLanguage,
              isOnboarded: user.profile.isOnboarded
            }
          : null
      }
    };
  }

  private hashOpaqueToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private resolveRefreshExpiry(ttl: string) {
    const match = ttl.match(/^(\d+)([dhm])$/);
    if (!match) {
      return new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    }
    const [, amountRaw, unit] = match;
    const amount = Number(amountRaw);
    const multiplier =
      unit === 'd'
        ? 1000 * 60 * 60 * 24
        : unit === 'h'
          ? 1000 * 60 * 60
          : 1000 * 60;
    return new Date(Date.now() + amount * multiplier);
  }
}
