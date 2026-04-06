import { BadRequestException } from '@nestjs/common';

type EnvRecord = Record<string, string | undefined>;

function requireString(env: EnvRecord, key: string) {
  const value = env[key];
  if (!value || value.trim() === '') {
    throw new BadRequestException(`Missing required environment variable: ${key}`);
  }
  return value;
}

function requirePort(env: EnvRecord, key: string, fallback: string) {
  const raw = env[key] ?? fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new BadRequestException(`Invalid port value for ${key}`);
  }
  return value;
}

export function validateEnv(env: EnvRecord) {
  return {
    DATABASE_URL: requireString(env, 'DATABASE_URL'),
    API_PORT: requirePort(env, 'API_PORT', '4000'),
    JWT_ACCESS_SECRET: requireString(env, 'JWT_ACCESS_SECRET'),
    JWT_REFRESH_SECRET: requireString(env, 'JWT_REFRESH_SECRET'),
    JWT_ACCESS_TTL: env.JWT_ACCESS_TTL ?? '15m',
    JWT_REFRESH_TTL: env.JWT_REFRESH_TTL ?? '30d',
    ADMIN_SEED_EMAIL: env.ADMIN_SEED_EMAIL ?? 'admin@papipo.local',
    ADMIN_SEED_PASSWORD: env.ADMIN_SEED_PASSWORD ?? 'ChangeMe123!',
    ADMIN_SEED_NAME: env.ADMIN_SEED_NAME ?? 'Papipo Admin',
    GEMINI_API_KEY: env.GEMINI_API_KEY ?? '',
    AI_PROVIDER: env.AI_PROVIDER ?? 'gemini'
  };
}
