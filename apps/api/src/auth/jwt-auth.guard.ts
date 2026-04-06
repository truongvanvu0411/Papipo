import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

export type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
    email: string;
    role: 'ADMIN' | 'USER';
    status: 'ACTIVE' | 'SUSPENDED';
  };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = header.slice('Bearer '.length);

    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET')
      }) as { sub: string; email: string; role: 'ADMIN' | 'USER' };
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, email: true, role: true, status: true }
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      if (user.status !== 'ACTIVE') {
        throw new ForbiddenException('Account is suspended');
      }
      request.user = {
        sub: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      };
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
