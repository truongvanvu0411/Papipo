import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { jest } from '@jest/globals';
import { HealthController } from './health/health.controller.js';
import { ApiExceptionFilter } from './common/http/api-exception.filter.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { RolesGuard } from './auth/roles.guard.js';
import { AdminController } from './admin/admin.controller.js';
import { AdminService } from './admin/admin.service.js';
import { WellnessController } from './wellness/wellness.controller.js';
import { WellnessService } from './wellness/wellness.service.js';
import { AiController } from './ai/ai.controller.js';
import { AiService } from './ai/ai.service.js';
import { UsersController } from './users/users.controller.js';
import { UsersService } from './users/users.service.js';

describe('Papipo HTTP routes', () => {
  let app: INestApplication;

  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    requestPasswordReset: jest.fn(),
    confirmPasswordReset: jest.fn(),
    getMe: jest.fn()
  } as unknown as AuthService;

  const adminService = {
    getOverview: jest.fn(),
    listUsersWithQuery: jest.fn(),
    getUserDetail: jest.fn(),
    updateUserStatus: jest.fn(),
    getUserActivity: jest.fn()
  } as unknown as AdminService;

  const wellnessService = {
    completeOnboarding: jest.fn(),
    getTodayDashboard: jest.fn(),
    createInitialCheckIn: jest.fn(),
    createDailyCheckIn: jest.fn(),
    logWater: jest.fn(),
    toggleHabit: jest.fn(),
    getRewards: jest.fn(),
    getTodayMealPlan: jest.fn(),
    logMeal: jest.fn(),
    logCustomMeal: jest.fn(),
    analyzeMealImage: jest.fn(),
    replanMeals: jest.fn(),
    getTodayWorkoutPlan: jest.fn(),
    regenerateWorkoutPlan: jest.fn(),
    completeWorkout: jest.fn()
  } as unknown as WellnessService;

  const aiService = {
    listConversations: jest.fn(),
    getConversationMessages: jest.fn(),
    chat: jest.fn()
  } as unknown as AiService;

  const usersService = {
    getCurrentUser: jest.fn(),
    updateCurrentUser: jest.fn()
  } as unknown as UsersService;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [
        HealthController,
        AuthController,
        AdminController,
        WellnessController,
        AiController,
        UsersController
      ],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AdminService, useValue: adminService },
        { provide: WellnessService, useValue: wellnessService },
        { provide: AiService, useValue: aiService },
        { provide: UsersService, useValue: usersService }
      ]
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: { switchToHttp(): { getRequest(): Record<string, unknown> } }) {
          const request = context.switchToHttp().getRequest() as {
            user?: { sub: string; role: string };
          };
          request.user = {
            sub: 'user-1',
            role: 'ADMIN'
          };
          return true;
        }
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true
      });

    const moduleRef = await moduleBuilder.compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true
      })
    );
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('serves health over HTTP', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('papipo-api');
  });

  it('logs in through auth HTTP route', async () => {
    (authService.login as any).mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: {
        id: 'user-1',
        email: 'demo@papipo.local',
        role: 'USER',
        status: 'ACTIVE',
        profile: null
      }
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'demo@papipo.local',
        password: 'ChangeMe123!'
      })
      .expect(201);

    expect(response.body.accessToken).toBe('access');
    expect(authService.login).toHaveBeenCalled();
  });

  it('rejects invalid profile updates through validation pipe', async () => {
    await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', 'Bearer fake')
      .send({
        preferredLanguage: 'en',
        unknownField: 'nope'
      })
      .expect(400);
  });

  it('serves admin overview through protected HTTP route', async () => {
    (adminService.getOverview as any).mockResolvedValue({
      totals: {
        users: 2,
        activeUsers: 2,
        suspendedUsers: 0,
        admins: 1
      },
      recentUsers: []
    });

    const response = await request(app.getHttpServer())
      .get('/admin/dashboard/overview')
      .set('Authorization', 'Bearer fake')
      .expect(200);

    expect(response.body.totals.users).toBe(2);
  });

  it('replans meals through wellness HTTP route', async () => {
    (wellnessService.replanMeals as any).mockResolvedValue({
      date: '2026-04-06T00:00:00.000Z',
      meals: [],
      mealLogs: [],
      metrics: {
        caloriesConsumed: 1200,
        caloriesTarget: 2000,
        proteinConsumed: 80,
        proteinTarget: 140,
        carbsConsumed: 110,
        carbsTarget: 220,
        fatConsumed: 40,
        fatTarget: 70,
        nutritionInsight: 'Balanced'
      },
      replanSummary: 'Adjusted the remaining meals.'
    });

    const response = await request(app.getHttpServer())
      .post('/meal-plans/replan')
      .set('Authorization', 'Bearer fake')
      .send({ notes: 'Keep dinner light' })
      .expect(201);

    expect(response.body.replanSummary).toContain('Adjusted');
  });

  it('sends AI coach chat over HTTP', async () => {
    (aiService.chat as any).mockResolvedValue({
      conversation: {
        id: 'conversation-1',
        title: 'Sleep support',
        createdAt: '2026-04-06T00:00:00.000Z',
        updatedAt: '2026-04-06T00:01:00.000Z',
        lastMessagePreview: 'Try winding down earlier.'
      },
      messages: [
        {
          id: 'message-1',
          conversationId: 'conversation-1',
          role: 'USER',
          content: 'I feel tired',
          createdAt: '2026-04-06T00:00:30.000Z'
        },
        {
          id: 'message-2',
          conversationId: 'conversation-1',
          role: 'ASSISTANT',
          content: 'Try winding down earlier.',
          createdAt: '2026-04-06T00:01:00.000Z'
        }
      ]
    });

    const response = await request(app.getHttpServer())
      .post('/ai/coach/chat')
      .set('Authorization', 'Bearer fake')
      .send({ message: 'I feel tired' })
      .expect(201);

    expect(response.body.messages).toHaveLength(2);
    expect(response.body.messages[1].role).toBe('ASSISTANT');
  });
});
