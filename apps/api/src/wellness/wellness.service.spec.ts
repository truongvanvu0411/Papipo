import { ConfigService } from '@nestjs/config';
import { jest } from '@jest/globals';
import { MealType } from '@prisma/client';
import { WellnessService } from './wellness.service.js';

describe('WellnessService nutrition AI', () => {
  const tx = {
    mealPlan: {
      delete: jest.fn(),
      createMany: jest.fn()
    },
    dailyMetric: {
      update: jest.fn()
    }
  };

  const prisma = {
    $transaction: jest.fn(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return arg(tx);
      }
      return Promise.all(arg as Array<Promise<unknown>>);
    }),
    mealLog: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    mealPlan: {
      findMany: jest.fn()
    },
    userProfile: {
      findUnique: jest.fn()
    },
    dailyMetric: {
      update: jest.fn()
    }
  } as any;

  const configService = {
    get: jest.fn((_key: string, fallback?: string) => fallback ?? '')
  } as unknown as ConfigService;

  const service = new WellnessService(prisma, configService);
  const ensureTodayPlansSpy = jest.spyOn(service as any, 'ensureTodayPlans');
  const ensureDailyMetricSpy = jest.spyOn(service as any, 'ensureDailyMetric');
  const getTodayMealPlanSpy = jest.spyOn(service, 'getTodayMealPlan');

  beforeEach(() => {
    jest.clearAllMocks();
    tx.mealPlan.delete.mockImplementation(async () => undefined);
    tx.mealPlan.createMany.mockImplementation(async () => undefined);
    tx.dailyMetric.update.mockImplementation(async () => undefined);
    prisma.dailyMetric.update.mockResolvedValue({ id: 'metric-1' });
    ensureTodayPlansSpy.mockResolvedValue(undefined);
    ensureDailyMetricSpy.mockResolvedValue({
      id: 'metric-1',
      caloriesTarget: 2000,
      caloriesConsumed: 1200,
      proteinTarget: 140,
      proteinConsumed: 70,
      carbsTarget: 220,
      carbsConsumed: 120,
      fatTarget: 70,
      fatConsumed: 30
    });
    getTodayMealPlanSpy.mockResolvedValue({
      date: '2026-04-06T00:00:00.000Z',
      meals: [],
      mealLogs: [],
      metrics: {
        caloriesConsumed: 1200,
        caloriesTarget: 2000,
        proteinConsumed: 70,
        proteinTarget: 140,
        carbsConsumed: 120,
        carbsTarget: 220,
        fatConsumed: 30,
        fatTarget: 70,
        nutritionInsight: 'Balanced'
      }
    });
  });

  it('analyzes a meal image with fallback logic and logs it', async () => {
    prisma.userProfile.findUnique.mockResolvedValue({
      preferredLanguage: 'en'
    });
    prisma.mealLog.create.mockResolvedValue({
      id: 'meal-log-1',
      date: new Date('2026-04-06T10:00:00.000Z'),
      mealType: MealType.SNACK,
      name: 'Burger Meal',
      calories: 780,
      protein: 28,
      carbs: 72,
      fat: 40,
      source: 'image-analysis'
    });

    const result = await service.analyzeMealImage('user-1', {
      mealType: 'SNACK' as any,
      base64Data: 'ZmFrZQ==',
      fileName: 'burger.jpg',
      mimeType: 'image/jpeg',
      notes: 'burger and fries'
    });

    expect(prisma.mealLog.create).toHaveBeenCalled();
    expect(result.analyzedMeal.name).toBe('Burger Meal');
    expect(result.summary).toContain('higher-calorie comfort meal');
    expect(result.nutrition).toBeDefined();
  });

  it('replans remaining meals around the current nutrition gap', async () => {
    prisma.userProfile.findUnique.mockResolvedValue({
      preferredLanguage: 'en'
    });
    prisma.mealPlan.findMany.mockResolvedValue([
      {
        id: 'meal-breakfast',
        mealType: MealType.BREAKFAST
      },
      {
        id: 'meal-dinner',
        mealType: MealType.DINNER
      },
      {
        id: 'meal-snack',
        mealType: MealType.SNACK
      }
    ]);
    prisma.mealLog.findMany.mockResolvedValue([
      {
        mealType: MealType.BREAKFAST
      }
    ]);

    const result = await service.replanMeals('user-1', {
      notes: 'Keep dinner light'
    });

    expect(tx.mealPlan.delete).toHaveBeenCalledTimes(2);
    expect(tx.mealPlan.createMany).toHaveBeenCalledTimes(1);
    expect(tx.dailyMetric.update).toHaveBeenCalledTimes(1);
    expect(result.replanSummary).toContain('Keep dinner light');
  });
});
