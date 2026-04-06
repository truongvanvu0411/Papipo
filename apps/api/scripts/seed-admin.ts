import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { hash } from 'bcryptjs';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';

loadEnv({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

async function main() {
  const prisma = new PrismaClient();
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME ?? 'Papipo Admin';

  if (!email || !password) {
    throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be configured');
  }

  const passwordHash = await hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash,
      profile: {
        upsert: {
          update: { name },
          create: {
            name,
            preferredLanguage: 'ja'
          }
        }
      }
    },
    create: {
      email,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          name,
          preferredLanguage: 'ja'
        }
      }
    }
  });

  console.log(`Admin user ensured: ${email}`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
