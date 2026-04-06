import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { requestLoggingMiddleware } from './common/http/request-logging.middleware.js';
import { validateEnv } from './common/config/env.validation.js';
import { AdminModule } from './admin/admin.module.js';
import { AiModule } from './ai/ai.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { WellnessModule } from './wellness/wellness.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      validate: validateEnv
    }),
    PrismaModule,
    AuthModule,
    AiModule,
    UsersModule,
    AdminModule,
    WellnessModule
  ],
  controllers: [HealthController]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(requestLoggingMiddleware).forRoutes('*');
  }
}
