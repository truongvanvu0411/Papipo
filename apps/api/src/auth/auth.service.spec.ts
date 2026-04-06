import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { jest } from '@jest/globals';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn()
    },
    refreshToken: {
      create: jest.fn()
    }
  } as any;
  const jwtService: any = {
    signAsync: jest.fn(async () => 'signed-token')
  };
  const configService = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
    get: jest.fn().mockReturnValue('15m')
  } as unknown as ConfigService;

  const service = new AuthService(prisma, jwtService, configService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.refreshToken.create.mockResolvedValue({ id: 'refresh-1' });
  });

  it('registers a new user and returns an access token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      status: 'ACTIVE',
      profile: {
        name: 'Papipo',
        preferredLanguage: 'ja'
      }
    });

    const result = await service.register({
      email: 'user@example.com',
      password: 'Password1',
      name: 'Papipo',
      preferredLanguage: 'ja'
    });

    expect(result.accessToken).toBe('signed-token');
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('rejects duplicate emails', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.register({
        email: 'user@example.com',
        password: 'Password1'
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid credentials on login', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'Password1'
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns a sanitized auth profile for getMe', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'secret-hash',
      role: 'USER',
      status: 'ACTIVE',
      profile: {
        name: 'Papipo',
        preferredLanguage: 'ja',
        isOnboarded: true
      }
    });

    const result = await service.getMe('user-1');

    expect(result).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      status: 'ACTIVE',
      profile: {
        name: 'Papipo',
        preferredLanguage: 'ja',
        isOnboarded: true
      }
    });
    expect(result).not.toHaveProperty('passwordHash');
  });
});
