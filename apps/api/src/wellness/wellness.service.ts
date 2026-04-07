import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  DashboardResponse,
  HabitView,
  MealAnalysisResponse,
  MealReplanResponse,
  NutritionDayResponse,
  RewardSummary,
  UserProfileResponse,
  WorkoutDayResponse,
  WorkoutPlanView
} from '@papipo/contracts';
import { Gender, MealType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto.js';
import { CreateCustomMealLogDto, CreateMealLogDto } from './dto/create-meal-log.dto.js';
import {
  CreateDailyCheckInDto,
  CreateInitialDailyCheckInDto
} from './dto/create-daily-check-in.dto.js';
import { LogWaterDto } from './dto/log-water.dto.js';
import { AnalyzeMealImageDto, ReplanMealsDto } from './dto/meal-ai.dto.js';
import { CompleteWorkoutDto, RegenerateWorkoutDto } from './dto/regenerate-workout.dto.js';

@Injectable()
export class WellnessService {
  private readonly prisma: PrismaService;
  private readonly configService: ConfigService;

  constructor(
    prisma: PrismaService,
    configService: ConfigService
  ) {
    this.prisma = prisma;
    this.configService = configService;
  }

  async completeOnboarding(userId: string, dto: CompleteOnboardingDto) {
    const { start, end } = this.getDayBounds();
    const language = this.normalizeLanguage(dto.preferredLanguage);
    const targets = this.calculateTargets(dto, language);
    const welcomeMessage = this.buildWelcomeMessage(dto, language);
    const meals = this.buildDefaultMeals(targets.caloriesTarget, language);
    const workout = this.buildWorkout(dto, undefined, language);
    const habits = this.buildDefaultHabits(language);

    await this.prisma.$transaction(async (tx) => {
      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          name: dto.name ?? null,
          age: dto.age,
          gender: dto.gender as Gender,
          heightCm: dto.heightCm,
          weightKg: dto.weightKg,
          goals: dto.goals,
          activityLevel: dto.activityLevel,
          planDuration: dto.planDuration,
          targetWeightChangeKg: dto.targetWeightChangeKg,
          targetTimeframe: dto.targetTimeframe,
          preferredLanguage: dto.preferredLanguage ?? 'ja',
          favoriteFoods: dto.favoriteFoods ?? [],
          activityPrefs: dto.activityPrefs ?? [],
          aiWelcomeMessage: welcomeMessage,
          isOnboarded: true
        },
        update: {
          name: dto.name ?? null,
          age: dto.age,
          gender: dto.gender as Gender,
          heightCm: dto.heightCm,
          weightKg: dto.weightKg,
          goals: dto.goals,
          activityLevel: dto.activityLevel,
          planDuration: dto.planDuration,
          targetWeightChangeKg: dto.targetWeightChangeKg,
          targetTimeframe: dto.targetTimeframe,
          preferredLanguage: dto.preferredLanguage ?? 'ja',
          favoriteFoods: dto.favoriteFoods ?? [],
          activityPrefs: dto.activityPrefs ?? [],
          aiWelcomeMessage: welcomeMessage,
          isOnboarded: true
        }
      });

      await tx.dailyMetric.upsert({
        where: {
          userId_date: {
            userId,
            date: start
          }
        },
        create: {
          userId,
          date: start,
          caloriesTarget: targets.caloriesTarget,
          proteinTarget: targets.proteinTarget,
          carbsTarget: targets.carbsTarget,
          fatTarget: targets.fatTarget,
          waterTargetLiters: targets.waterTargetLiters,
          nutritionInsight: targets.nutritionInsight
        },
        update: {
          caloriesTarget: targets.caloriesTarget,
          proteinTarget: targets.proteinTarget,
          carbsTarget: targets.carbsTarget,
          fatTarget: targets.fatTarget,
          waterTargetLiters: targets.waterTargetLiters,
          nutritionInsight: targets.nutritionInsight
        }
      });

      await tx.habitDefinition.deleteMany({ where: { userId } });
      await tx.habitDefinition.createMany({
        data: habits.map((habit) => ({
          userId,
          name: habit.name,
          icon: habit.icon,
          isWaterHabit: habit.isWaterHabit
        }))
      });

      await tx.badgeProgress.createMany({
        data: [
          { userId, code: 'water-warrior' },
          { userId, code: 'consistency-king' },
          { userId, code: 'balance-master' }
        ],
        skipDuplicates: true
      });

      await tx.mealPlan.deleteMany({ where: { userId, date: { gte: start, lt: end } } });
      await tx.mealPlan.createMany({
        data: meals.map((meal) => ({
          userId,
          date: start,
          mealType: meal.mealType,
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          reason: meal.reason
        }))
      });

      await tx.workoutPlan.deleteMany({ where: { userId, date: { gte: start, lt: end } } });
      await tx.workoutPlan.create({
        data: {
          userId,
          date: start,
          title: workout.title,
          duration: workout.duration,
          intensity: workout.intensity,
          calories: workout.calories,
          exercises: {
            create: workout.exercises.map((exercise, index) => ({
              slug: exercise.slug,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              position: index
            }))
          }
        }
      });
    });

    return this.getTodayDashboard(userId);
  }

  async getTodayDashboard(userId: string): Promise<DashboardResponse> {
    await this.ensureTodayPlans(userId);
    const { start, end } = this.getDayBounds();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        dailyMetrics: {
          where: { date: { gte: start, lt: end } },
          take: 1
        },
        habits: true,
        mealPlans: {
          where: { date: { gte: start, lt: end } },
          orderBy: { mealType: 'asc' }
        },
        workoutPlans: {
          where: { date: { gte: start, lt: end } },
          include: { exercises: { orderBy: { position: 'asc' } } },
          take: 1
        },
        badgeProgress: true,
        habitLogs: {
          where: { date: { gte: start, lt: end } }
        },
        dailyCheckIns: {
          where: { date: { gte: start, lt: end } },
          take: 1
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const metric = await this.ensureDailyMetric(userId, user.profile);
    const rewards = this.toRewardSummary(metric.gems, user.badgeProgress);
    const habitLogMap = new Map(user.habitLogs.map((item) => [item.habitId, item.completed]));
    const workout = user.workoutPlans[0];
    const language = this.normalizeLanguage(user.profile?.preferredLanguage ?? 'ja');

    return {
      date: start.toISOString(),
      profile: user.profile
        ? {
            name: user.profile.name,
            preferredLanguage: user.profile.preferredLanguage,
            aiWelcomeMessage: user.profile.aiWelcomeMessage,
            isOnboarded: user.profile.isOnboarded,
            goals: user.profile.goals
          }
        : null,
      metrics: {
        readiness: metric.readiness,
        sleepScore: metric.sleepScore,
        caloriesConsumed: metric.caloriesConsumed,
        caloriesTarget: metric.caloriesTarget,
        proteinConsumed: metric.proteinConsumed,
        proteinTarget: metric.proteinTarget,
        carbsConsumed: metric.carbsConsumed,
        carbsTarget: metric.carbsTarget,
        fatConsumed: metric.fatConsumed,
        fatTarget: metric.fatTarget,
        waterConsumedLiters: Number(metric.waterConsumedLiters),
        waterTargetLiters: Number(metric.waterTargetLiters),
        dailyInsight: metric.dailyInsight,
        nutritionInsight: metric.nutritionInsight,
        hasCompletedCheckInToday: user.dailyCheckIns.length > 0
      },
      habits: user.habits.map<HabitView>((habit) => ({
        id: habit.id,
        name: this.localizeHabitName(habit.name, language),
        icon: habit.icon,
        isWaterHabit: habit.isWaterHabit,
        completed: habitLogMap.get(habit.id) ?? false
      })),
      meals: user.mealPlans.map((meal) => ({
        id: meal.id,
        mealType: meal.mealType,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        reason: meal.reason
      })),
      workout: workout
        ? {
            id: workout.id,
            title: workout.title,
            duration: workout.duration,
            intensity: workout.intensity,
            calories: workout.calories,
            completedAt: workout.completedAt?.toISOString() ?? null,
            exercises: workout.exercises.map((exercise) => ({
              id: exercise.id,
              slug: exercise.slug,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              position: exercise.position
            }))
          } satisfies WorkoutPlanView
        : null,
      rewards
    };
  }

  async createInitialCheckIn(userId: string, dto: CreateInitialDailyCheckInDto) {
    const language = await this.getPreferredLanguage(userId);
    const lowered = dto.selectedState.toLowerCase();
    const sleepScore = lowered.includes('great') || lowered.includes('energy') ? 88 : lowered.includes('tired') ? 48 : 70;
    const readinessScore = lowered.includes('great') || lowered.includes('energy') ? 84 : lowered.includes('tired') ? 45 : 68;
    const insight = this.buildInitialCheckInInsight(readinessScore, language);

    return this.persistCheckIn(userId, {
      sleepHours: 7,
      sleepQuality: readinessScore >= 80 ? 4 : 3,
      soreness: readinessScore <= 50 ? 4 : 2,
      stress: readinessScore <= 50 ? 4 : 2,
      readinessScore,
      sleepScore,
      insight
    });
  }

  async createDailyCheckIn(userId: string, dto: CreateDailyCheckInDto) {
    const language = await this.getPreferredLanguage(userId);
    const sleepScore = Math.max(
      0,
      Math.min(100, Math.round(dto.sleepHours * 10 + dto.sleepQuality * 8))
    );
    const readinessScore = Math.max(
      0,
      Math.min(100, Math.round(sleepScore * 0.6 + (6 - dto.soreness) * 8 + (6 - dto.stress) * 8))
    );
    const insight = this.buildDailyCheckInInsight(readinessScore, language);

    return this.persistCheckIn(userId, {
      sleepHours: dto.sleepHours,
      sleepQuality: dto.sleepQuality,
      soreness: dto.soreness,
      stress: dto.stress,
      readinessScore,
      sleepScore,
      insight
    });
  }

  async logWater(userId: string, dto: LogWaterDto) {
    const { start } = this.getDayBounds();
    const metric = await this.ensureDailyMetric(userId);

    await this.prisma.waterLog.create({
      data: {
        userId,
        date: new Date(),
        amountLiters: dto.amountLiters,
        sourceLabel: dto.sourceLabel
      }
    });

    const updated = await this.prisma.dailyMetric.update({
      where: { id: metric.id },
      data: {
        waterConsumedLiters: new Prisma.Decimal(Number(metric.waterConsumedLiters) + dto.amountLiters),
        gems: metric.gems + 2
      }
    });

    await this.updateBadgeProgress(userId, updated);

    return {
      date: start.toISOString(),
      waterConsumedLiters: Number(updated.waterConsumedLiters),
      gems: updated.gems
    };
  }

  async toggleHabit(userId: string, habitId: string) {
    const { start } = this.getDayBounds();
    const metric = await this.ensureDailyMetric(userId);
    const habit = await this.prisma.habitDefinition.findFirst({
      where: { id: habitId, userId }
    });
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    const existing = await this.prisma.habitLog.findFirst({
      where: {
        userId,
        habitId,
        date: start
      }
    });

    const completed = !(existing?.completed ?? false);

    const [, updatedMetric] = await this.prisma.$transaction([
      existing
        ? this.prisma.habitLog.update({
            where: { id: existing.id },
            data: { completed }
          })
        : this.prisma.habitLog.create({
            data: {
              userId,
              habitId,
              date: start,
              completed
            }
          }),
      this.prisma.dailyMetric.update({
        where: { id: metric.id },
        data: {
          gems: completed ? metric.gems + (habit.isWaterHabit ? 2 : 5) : metric.gems
        }
      })
    ]);

    await this.updateBadgeProgress(userId, updatedMetric);

    return {
      habitId,
      completed,
      gems: updatedMetric.gems
    };
  }

  async getRewards(userId: string): Promise<RewardSummary> {
    const metric = await this.ensureDailyMetric(userId);
    const badges = await this.prisma.badgeProgress.findMany({
      where: { userId },
      orderBy: { code: 'asc' }
    });

    return this.toRewardSummary(metric.gems, badges);
  }

  async getTodayMealPlan(userId: string): Promise<NutritionDayResponse> {
    await this.ensureTodayPlans(userId);
    const { start, end } = this.getDayBounds();
    const metric = await this.ensureDailyMetric(userId);
    const [meals, mealLogs] = await Promise.all([
      this.prisma.mealPlan.findMany({
        where: { userId, date: { gte: start, lt: end } },
        orderBy: { mealType: 'asc' }
      }),
      this.prisma.mealLog.findMany({
        where: { userId, date: { gte: start, lt: end } },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      date: start.toISOString(),
      meals: meals.map((meal) => ({
        id: meal.id,
        mealType: meal.mealType,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        reason: meal.reason
      })),
      mealLogs: mealLogs.map((log) => ({
        id: log.id,
        date: log.date.toISOString(),
        mealType: log.mealType,
        name: log.name,
        calories: log.calories,
        protein: log.protein,
        carbs: log.carbs,
        fat: log.fat,
        source: log.source
      })),
      metrics: {
        caloriesConsumed: metric.caloriesConsumed,
        caloriesTarget: metric.caloriesTarget,
        proteinConsumed: metric.proteinConsumed,
        proteinTarget: metric.proteinTarget,
        carbsConsumed: metric.carbsConsumed,
        carbsTarget: metric.carbsTarget,
        fatConsumed: metric.fatConsumed,
        fatTarget: metric.fatTarget,
        nutritionInsight: metric.nutritionInsight
      }
    };
  }

  async logMeal(userId: string, dto: CreateMealLogDto) {
    const { start } = this.getDayBounds();
    const metric = await this.ensureDailyMetric(userId);

    let mealPayload:
      | {
          mealType: MealType;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          source: string | null;
        }
      | undefined;

    if (dto.mealPlanId) {
      const mealPlan = await this.prisma.mealPlan.findFirst({
        where: { id: dto.mealPlanId, userId }
      });
      if (!mealPlan) {
        throw new NotFoundException('Meal plan not found');
      }
      mealPayload = {
        mealType: mealPlan.mealType,
        name: mealPlan.name,
        calories: mealPlan.calories,
        protein: mealPlan.protein,
        carbs: mealPlan.carbs,
        fat: mealPlan.fat,
        source: dto.source ?? 'meal-plan'
      };
    }

    if (!mealPayload && dto.mealType) {
      const mealPlan = await this.prisma.mealPlan.findFirst({
        where: {
          userId,
          date: start,
          mealType: dto.mealType as MealType
        },
        orderBy: { createdAt: 'desc' }
      });
      if (!mealPlan) {
        throw new NotFoundException('Meal plan not found for that meal type');
      }
      mealPayload = {
        mealType: mealPlan.mealType,
        name: mealPlan.name,
        calories: mealPlan.calories,
        protein: mealPlan.protein,
        carbs: mealPlan.carbs,
        fat: mealPlan.fat,
        source: dto.source ?? 'meal-plan'
      };
    }

    if (!mealPayload) {
      throw new BadRequestException('mealPlanId or mealType is required');
    }

    await this.recordMealLog(userId, metric.id, {
      date: new Date(),
      ...mealPayload
    });

    return this.getTodayMealPlan(userId);
  }

  async logCustomMeal(userId: string, dto: CreateCustomMealLogDto) {
    const metric = await this.ensureDailyMetric(userId);
    await this.recordMealLog(userId, metric.id, {
      date: new Date(),
      mealType: dto.mealType as MealType,
      name: dto.name,
      calories: dto.calories,
      protein: dto.protein,
      carbs: dto.carbs,
      fat: dto.fat,
      source: dto.source ?? 'custom'
    });

    return this.getTodayMealPlan(userId);
  }

  async analyzeMealImage(userId: string, dto: AnalyzeMealImageDto): Promise<MealAnalysisResponse> {
    if ((!dto.base64Data || dto.base64Data.trim().length === 0) && (!dto.notes || dto.notes.trim().length === 0)) {
      throw new BadRequestException('Provide an image payload or meal notes for analysis');
    }

    const metric = await this.ensureDailyMetric(userId);
    const language = await this.getPreferredLanguage(userId);
    const analyzedMeal = await this.estimateMealFromImage(dto, metric, language);

    const mealLog = await this.recordMealLog(userId, metric.id, {
      date: new Date(),
      mealType: (dto.mealType as MealType | undefined) ?? MealType.SNACK,
      name: analyzedMeal.name,
      calories: analyzedMeal.calories,
      protein: analyzedMeal.protein,
      carbs: analyzedMeal.carbs,
      fat: analyzedMeal.fat,
      source: 'image-analysis'
    });

    return {
      analyzedMeal: {
        id: mealLog.id,
        date: mealLog.date.toISOString(),
        mealType: mealLog.mealType,
        name: mealLog.name,
        calories: mealLog.calories,
        protein: mealLog.protein,
        carbs: mealLog.carbs,
        fat: mealLog.fat,
        source: mealLog.source
      },
      summary: analyzedMeal.summary,
      nutrition: await this.getTodayMealPlan(userId)
    };
  }

  async replanMeals(userId: string, dto: ReplanMealsDto): Promise<MealReplanResponse> {
    await this.ensureTodayPlans(userId);
    const { start, end } = this.getDayBounds();
    const metric = await this.ensureDailyMetric(userId);
    const [profile, mealPlans, mealLogs] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.mealPlan.findMany({
        where: { userId, date: { gte: start, lt: end } },
        orderBy: { mealType: 'asc' }
      }),
      this.prisma.mealLog.findMany({
        where: { userId, date: { gte: start, lt: end } }
      })
    ]);

    const loggedMealTypes = new Set(mealLogs.map((log) => log.mealType));
    const replanTargets = mealPlans.filter((meal) => !loggedMealTypes.has(meal.mealType));
    if (replanTargets.length === 0) {
      const current = await this.getTodayMealPlan(userId);
      return {
        ...current,
        replanSummary: this.localizeNoMealsToReplan(profile?.preferredLanguage ?? 'ja')
      };
    }

    const remainingCalories = Math.max(250, metric.caloriesTarget - metric.caloriesConsumed);
    const remainingProtein = Math.max(20, metric.proteinTarget - metric.proteinConsumed);
    const remainingCarbs = Math.max(20, metric.carbsTarget - metric.carbsConsumed);
    const remainingFat = Math.max(8, metric.fatTarget - metric.fatConsumed);

    const rebuiltMeals = await this.buildReplannedMeals({
      mealTypes: replanTargets.map((meal) => meal.mealType),
      calories: remainingCalories,
      protein: remainingProtein,
      carbs: remainingCarbs,
      fat: remainingFat,
      notes: dto.notes,
      preferredLanguage: profile?.preferredLanguage ?? 'ja'
    });

    await this.prisma.$transaction(async (tx) => {
      for (const meal of replanTargets) {
        await tx.mealPlan.delete({
          where: { id: meal.id }
        });
      }

      await tx.mealPlan.createMany({
        data: rebuiltMeals.map((meal) => ({
          userId,
          date: start,
          mealType: meal.mealType,
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          reason: meal.reason
        }))
      });

      await tx.dailyMetric.update({
        where: { id: metric.id },
        data: {
          nutritionInsight: this.buildReplanSummary({
            remainingCalories,
            remainingProtein,
            remainingCarbs,
            remainingFat,
            notes: dto.notes,
            preferredLanguage: profile?.preferredLanguage ?? 'ja'
          })
        }
      });
    });

    const response = await this.getTodayMealPlan(userId);
    return {
      ...response,
      replanSummary: this.buildReplanSummary({
        remainingCalories,
        remainingProtein,
        remainingCarbs,
        remainingFat,
        notes: dto.notes,
        preferredLanguage: profile?.preferredLanguage ?? 'ja'
      })
    };
  }

  async getTodayWorkoutPlan(userId: string): Promise<WorkoutDayResponse> {
    await this.ensureTodayPlans(userId);
    const { start, end } = this.getDayBounds();
    const workout = await this.prisma.workoutPlan.findFirst({
      where: { userId, date: { gte: start, lt: end } },
      include: { exercises: { orderBy: { position: 'asc' } } }
    });

    return {
      date: start.toISOString(),
      workout: workout
        ? {
            id: workout.id,
            title: workout.title,
            duration: workout.duration,
            intensity: workout.intensity,
            calories: workout.calories,
            completedAt: workout.completedAt?.toISOString() ?? null,
            exercises: workout.exercises.map((exercise) => ({
              id: exercise.id,
              slug: exercise.slug,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              position: exercise.position
            }))
          }
        : null,
      completedToday: Boolean(workout?.completedAt)
    };
  }

  async regenerateWorkoutPlan(userId: string, dto: RegenerateWorkoutDto) {
    const { start, end } = this.getDayBounds();
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId }
    });
    const workout = this.buildWorkout(
      {
        targetWeightChangeKg: profile?.targetWeightChangeKg ?? 0,
        activityPrefs: dto.focus ? [dto.focus] : profile?.activityPrefs ?? []
      },
      dto.focus,
      profile?.preferredLanguage ?? 'ja'
    );

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.workoutPlan.findFirst({
        where: { userId, date: { gte: start, lt: end } }
      });

      if (existing) {
        await tx.workoutExercise.deleteMany({
          where: { workoutPlanId: existing.id }
        });
        await tx.workoutPlan.update({
          where: { id: existing.id },
          data: {
            title: workout.title,
            duration: workout.duration,
            intensity: workout.intensity,
            calories: workout.calories,
            completedAt: null
          }
        });
        await tx.workoutExercise.createMany({
          data: workout.exercises.map((exercise, index) => ({
            workoutPlanId: existing.id,
            slug: exercise.slug,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            position: index
          }))
        });
        return;
      }

      await tx.workoutPlan.create({
        data: {
          userId,
          date: start,
          title: workout.title,
          duration: workout.duration,
          intensity: workout.intensity,
          calories: workout.calories,
          exercises: {
            create: workout.exercises.map((exercise, index) => ({
              slug: exercise.slug,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              position: index
            }))
          }
        }
      });
    });

    return this.getTodayWorkoutPlan(userId);
  }

  async completeWorkout(userId: string, dto: CompleteWorkoutDto) {
    const { start, end } = this.getDayBounds();
    const metric = await this.ensureDailyMetric(userId);
    const workout = dto.workoutPlanId
      ? await this.prisma.workoutPlan.findFirst({
          where: { id: dto.workoutPlanId, userId }
        })
      : await this.prisma.workoutPlan.findFirst({
          where: { userId, date: { gte: start, lt: end } }
        });

    if (!workout) {
      throw new NotFoundException('Workout plan not found');
    }

    await this.prisma.$transaction([
      this.prisma.workoutPlan.update({
        where: { id: workout.id },
        data: { completedAt: new Date() }
      }),
      this.prisma.dailyMetric.update({
        where: { id: metric.id },
        data: { gems: metric.gems + 12 }
      })
    ]);

    return this.getTodayWorkoutPlan(userId);
  }

  private async ensureTodayPlans(userId: string) {
    const { start, end } = this.getDayBounds();
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile?.isOnboarded) {
      return;
    }

    const metric = await this.ensureDailyMetric(userId, profile);
    const [mealCount, workoutCount] = await Promise.all([
      this.prisma.mealPlan.count({
        where: { userId, date: { gte: start, lt: end } }
      }),
      this.prisma.workoutPlan.count({
        where: { userId, date: { gte: start, lt: end } }
      })
    ]);

    const tasks: Array<Promise<unknown>> = [];

    if (mealCount === 0) {
      const meals = this.buildDefaultMeals(metric.caloriesTarget);
      tasks.push(
        this.prisma.mealPlan.createMany({
          data: meals.map((meal) => ({
            userId,
            date: start,
            mealType: meal.mealType,
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            reason: meal.reason
          }))
        })
      );
    }

    if (workoutCount === 0) {
      const workout = this.buildWorkout({
        targetWeightChangeKg: profile.targetWeightChangeKg ?? 0,
        activityPrefs: profile.activityPrefs
      });
      tasks.push(
        this.prisma.workoutPlan.create({
          data: {
            userId,
            date: start,
            title: workout.title,
            duration: workout.duration,
            intensity: workout.intensity,
            calories: workout.calories,
            exercises: {
              create: workout.exercises.map((exercise, index) => ({
                slug: exercise.slug,
                name: exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                position: index
              }))
            }
          }
        })
      );
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  }

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        profile: true,
        badgeProgress: true,
        dailyMetrics: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.profile
        ? {
            name: user.profile.name,
            age: user.profile.age,
            gender: user.profile.gender,
            heightCm: user.profile.heightCm,
            weightKg: user.profile.weightKg,
            goals: user.profile.goals,
            activityLevel: user.profile.activityLevel,
            planDuration: user.profile.planDuration,
            targetWeightChangeKg: user.profile.targetWeightChangeKg,
            targetTimeframe: user.profile.targetTimeframe,
            preferredLanguage: user.profile.preferredLanguage,
            favoriteFoods: user.profile.favoriteFoods,
            activityPrefs: user.profile.activityPrefs,
            aiWelcomeMessage: user.profile.aiWelcomeMessage,
            isOnboarded: user.profile.isOnboarded,
            lastCheckInDate: user.profile.lastCheckInDate?.toISOString() ?? null
          }
        : null,
      rewards: this.toRewardSummary(user.dailyMetrics[0]?.gems ?? 0, user.badgeProgress)
    };
  }

  async updateUserProfile(userId: string, payload: Partial<CompleteOnboardingDto>) {
    const existing = await this.prisma.userProfile.findUnique({
      where: { userId }
    });
    if (!existing) {
      throw new BadRequestException('Complete onboarding before editing profile');
    }

    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        name: payload.name ?? existing.name,
        age: payload.age ?? existing.age,
        gender: (payload.gender as Gender | undefined) ?? existing.gender,
        heightCm: payload.heightCm ?? existing.heightCm,
        weightKg: payload.weightKg ?? existing.weightKg,
        goals: payload.goals ?? existing.goals,
        activityLevel: payload.activityLevel ?? existing.activityLevel,
        planDuration: payload.planDuration ?? existing.planDuration,
        targetWeightChangeKg: payload.targetWeightChangeKg ?? existing.targetWeightChangeKg,
        targetTimeframe: payload.targetTimeframe ?? existing.targetTimeframe,
        preferredLanguage: payload.preferredLanguage ?? existing.preferredLanguage,
        favoriteFoods: payload.favoriteFoods ?? existing.favoriteFoods,
        activityPrefs: payload.activityPrefs ?? existing.activityPrefs
      }
    });

    return this.getUserProfile(userId);
  }

  private async persistCheckIn(
    userId: string,
    payload: {
      sleepHours: number;
      sleepQuality: number;
      soreness: number;
      stress: number;
      readinessScore: number;
      sleepScore: number;
      insight: string;
    }
  ) {
    const { start } = this.getDayBounds();
    const metric = await this.ensureDailyMetric(userId);

    await this.prisma.$transaction([
      this.prisma.dailyCheckIn.create({
        data: {
          userId,
          date: start,
          sleepHours: payload.sleepHours,
          sleepQuality: payload.sleepQuality,
          soreness: payload.soreness,
          stress: payload.stress,
          readinessScore: payload.readinessScore,
          sleepScore: payload.sleepScore,
          insight: payload.insight
        }
      }),
      this.prisma.dailyMetric.update({
        where: { id: metric.id },
        data: {
          readiness: payload.readinessScore,
          sleepScore: payload.sleepScore,
          dailyInsight: payload.insight
        }
      }),
      this.prisma.userProfile.updateMany({
        where: { userId },
        data: {
          lastCheckInDate: start
        }
      })
    ]);

    return this.getTodayDashboard(userId);
  }

  private async recordMealLog(
    userId: string,
    metricId: string,
    payload: {
      date: Date;
      mealType: MealType;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      source: string | null;
    }
  ) {
    const [mealLog] = await this.prisma.$transaction([
      this.prisma.mealLog.create({
        data: {
          userId,
          date: payload.date,
          mealType: payload.mealType,
          name: payload.name,
          calories: payload.calories,
          protein: payload.protein,
          carbs: payload.carbs,
          fat: payload.fat,
          source: payload.source
        }
      }),
      this.prisma.dailyMetric.update({
        where: { id: metricId },
        data: {
          caloriesConsumed: { increment: payload.calories },
          proteinConsumed: { increment: payload.protein },
          carbsConsumed: { increment: payload.carbs },
          fatConsumed: { increment: payload.fat },
          gems: { increment: 4 }
        }
      })
    ]);

    return mealLog;
  }

  private async estimateMealFromImage(
    dto: AnalyzeMealImageDto,
    metric: {
      caloriesTarget: number;
      caloriesConsumed: number;
      proteinTarget: number;
      proteinConsumed: number;
    },
    preferredLanguage: string
  ) {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    const provider = this.configService.get<string>('AI_PROVIDER', 'gemini');
    if (provider === 'gemini' && geminiKey && geminiKey.trim() !== '') {
      try {
        const prompt = [
          'Estimate the meal in this image and respond with JSON only.',
          'Return: {"name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "summary": string}.',
          `Optional user hint: ${dto.notes?.trim() || 'none'}`,
          `Remaining calories today: ${Math.max(0, metric.caloriesTarget - metric.caloriesConsumed)}.`,
          `Remaining protein today: ${Math.max(0, metric.proteinTarget - metric.proteinConsumed)}.`
        ].join('\n');

        const parts: Array<Record<string, unknown>> = [{ text: prompt }];
        if (dto.base64Data?.trim()) {
          parts.push({
            inlineData: {
              mimeType: dto.mimeType?.trim() || 'image/jpeg',
              data: dto.base64Data.trim()
            }
          });
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }]
            })
          }
        );

        if (response.ok) {
          const json = (await response.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          const parsed = this.tryParseJson(text);
          if (parsed) {
            return {
              name: typeof parsed.name === 'string' ? parsed.name : 'Analyzed Meal',
              calories: this.clampNumber(parsed.calories, 80, 1800, 420),
              protein: this.clampNumber(parsed.protein, 0, 200, 24),
              carbs: this.clampNumber(parsed.carbs, 0, 300, 40),
              fat: this.clampNumber(parsed.fat, 0, 120, 14),
              summary:
                typeof parsed.summary === 'string'
                  ? parsed.summary
                  : this.localizeMealAnalysisSummary(preferredLanguage)
            };
          }
        }
      } catch {
        // Fallback below keeps the flow usable offline and in tests.
      }
    }

    const hint = `${dto.fileName ?? ''} ${dto.notes ?? ''}`.toLowerCase();
    if (hint.includes('salad')) {
      return {
        name: this.localizeMealNameByKey('chicken-salad-bowl', preferredLanguage),
        calories: 360,
        protein: 30,
        carbs: 18,
        fat: 16,
        summary: this.localizeMealSummaryByKey('salad', preferredLanguage)
      };
    }
    if (hint.includes('burger') || hint.includes('fries')) {
      return {
        name: this.localizeMealNameByKey('burger-meal', preferredLanguage),
        calories: 780,
        protein: 28,
        carbs: 72,
        fat: 40,
        summary: this.localizeMealSummaryByKey('burger', preferredLanguage)
      };
    }
    if (hint.includes('sushi') || hint.includes('rice')) {
      return {
        name: this.localizeMealNameByKey('rice-meal', preferredLanguage),
        calories: 520,
        protein: 24,
        carbs: 68,
        fat: 14,
        summary: this.localizeMealSummaryByKey('rice', preferredLanguage)
      };
    }

    return {
      name: this.localizeMealNameByKey('analyzed-meal', preferredLanguage),
      calories: 430,
      protein: 26,
      carbs: 42,
      fat: 16,
      summary: this.localizeMealAnalysisSummary(preferredLanguage)
    };
  }

  private async buildReplannedMeals(input: {
    mealTypes: MealType[];
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    notes?: string;
    preferredLanguage?: string;
  }) {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    const provider = this.configService.get<string>('AI_PROVIDER', 'gemini');
    if (provider === 'gemini' && geminiKey && geminiKey.trim() !== '') {
      try {
        const prompt = [
          'Create a remaining-day meal plan and return JSON only.',
          'Return an array of meals with shape:',
          '[{"mealType":"BREAKFAST|LUNCH|DINNER|SNACK","name":string,"calories":number,"protein":number,"carbs":number,"fat":number,"reason":string}]',
          `Meal types to fill: ${input.mealTypes.join(', ')}`,
          `Remaining calories: ${input.calories}`,
          `Remaining protein: ${input.protein}`,
          `Remaining carbs: ${input.carbs}`,
          `Remaining fat: ${input.fat}`,
          `Preferred language: ${input.preferredLanguage ?? 'ja'}`,
          `Notes: ${input.notes?.trim() || 'none'}`
        ].join('\n');

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }]
                }
              ]
            })
          }
        );

        if (response.ok) {
          const json = (await response.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          const parsed = this.tryParseJson(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, input.mealTypes.length).map((meal, index) => ({
              mealType: input.mealTypes[index] ?? MealType.SNACK,
              name:
                typeof meal?.name === 'string'
                  ? meal.name
                  : this.defaultMealName(
                      input.mealTypes[index] ?? MealType.SNACK,
                      input.notes,
                      input.preferredLanguage ?? 'ja'
                    ),
              calories: this.clampNumber(meal?.calories, 120, 1400, Math.round(input.calories / input.mealTypes.length)),
              protein: this.clampNumber(meal?.protein, 8, 120, Math.round(input.protein / input.mealTypes.length)),
              carbs: this.clampNumber(meal?.carbs, 8, 180, Math.round(input.carbs / input.mealTypes.length)),
              fat: this.clampNumber(meal?.fat, 4, 80, Math.round(input.fat / input.mealTypes.length)),
              reason:
                typeof meal?.reason === 'string'
                  ? meal.reason
                  : this.localizeReplanReason('aligned', input.preferredLanguage ?? 'ja')
            }));
          }
        }
      } catch {
        // Deterministic fallback below.
      }
    }

    const count = Math.max(1, input.mealTypes.length);
    return input.mealTypes.map((mealType, index) => {
      const calories = Math.max(120, Math.round(input.calories / count));
      const protein = Math.max(12, Math.round(input.protein / count));
      const carbs = Math.max(15, Math.round(input.carbs / count));
      const fat = Math.max(6, Math.round(input.fat / count));
      return {
        mealType,
        name: this.defaultMealName(mealType, input.notes, input.preferredLanguage ?? 'ja'),
        calories,
        protein,
        carbs,
        fat,
        reason:
          index === 0
            ? this.localizeReplanReason('rebalanced', input.preferredLanguage ?? 'ja')
            : this.localizeReplanReason('lighter-protein', input.preferredLanguage ?? 'ja')
      };
    });
  }

  private buildReplanSummary(input: {
    remainingCalories: number;
    remainingProtein: number;
    remainingCarbs: number;
    remainingFat: number;
    notes?: string;
    preferredLanguage?: string;
  }) {
    const language = this.normalizeLanguage(input.preferredLanguage ?? 'ja');
    const notePart =
      input.notes && input.notes.trim().length > 0
        ? language === 'ja'
          ? ` 追加メモ: ${input.notes.trim()}。`
          : ` I also factored in: ${input.notes.trim()}.`
        : '';
    if (language === 'ja') {
      return `今日の残りは約${input.remainingCalories}kcal、たんぱく質${input.remainingProtein}g、炭水化物${input.remainingCarbs}g、脂質${input.remainingFat}gを目安に再調整しました。${notePart}`.trim();
    }
    return `Your remaining meals were rebalanced toward about ${input.remainingCalories} kcal with roughly ${input.remainingProtein}g protein, ${input.remainingCarbs}g carbs, and ${input.remainingFat}g fat left for today.${notePart}`;
  }

  private defaultMealName(mealType: MealType, notes?: string, preferredLanguage = 'ja') {
    const hint = notes?.toLowerCase() ?? '';
    if (hint.includes('light')) {
      if (this.normalizeLanguage(preferredLanguage) === 'ja') {
        return mealType === MealType.SNACK ? 'ライトプロテインスナック' : '軽めのリカバリープレート';
      }
      return mealType === MealType.SNACK ? 'Light Protein Snack' : 'Light Recovery Plate';
    }
    const language = this.normalizeLanguage(preferredLanguage);
    switch (mealType) {
      case MealType.BREAKFAST:
        return language === 'ja' ? 'プロテインオーツ朝食' : 'Protein Oats Reset';
      case MealType.LUNCH:
        return language === 'ja' ? 'リーンランチボウル' : 'Lean Lunch Bowl';
      case MealType.DINNER:
        return language === 'ja' ? 'リカバリーディナープレート' : 'Recovery Dinner Plate';
      case MealType.SNACK:
      default:
        return language === 'ja' ? 'プロテインスマートスナック' : 'Protein Smart Snack';
    }
  }

  private tryParseJson(text?: string | null): any {
    if (!text || text.trim().length === 0) {
      return null;
    }
    const normalized = text
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    try {
      return JSON.parse(normalized);
    } catch {
      return null;
    }
  }

  private clampNumber(value: unknown, min: number, max: number, fallback: number) {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, Math.round(numeric)));
  }

  private async getPreferredLanguage(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { preferredLanguage: true }
    });
    return this.normalizeLanguage(profile?.preferredLanguage ?? 'ja');
  }

  private normalizeLanguage(preferredLanguage?: string | null) {
    if (preferredLanguage === 'vi') return 'vi';
    if (preferredLanguage === 'en') return 'en';
    return 'ja';
  }

  private buildInitialCheckInInsight(readinessScore: number, preferredLanguage: string) {
    const language = this.normalizeLanguage(preferredLanguage);
    if (language === 'ja') {
      if (readinessScore >= 80) {
        return '今日はコンディションが良さそうです。勢いを保ちつつ、水分補給も忘れずに進めましょう。';
      }
      if (readinessScore <= 50) {
        return '今日は少し軽めにして、回復・睡眠・水分補給を優先しましょう。';
      }
      return '今日は土台が安定しています。ルーティンを整えて、明日またチェックしましょう。';
    }
    if (readinessScore >= 80) {
      return 'You are in a strong state today. Keep the momentum and stay hydrated.';
    }
    if (readinessScore <= 50) {
      return 'Take the day a little lighter and prioritize recovery, sleep, and hydration.';
    }
    return 'You have a balanced base today. Keep your routine steady and check in again tomorrow.';
  }

  private buildDailyCheckInInsight(readinessScore: number, preferredLanguage: string) {
    const language = this.normalizeLanguage(preferredLanguage);
    if (language === 'ja') {
      if (readinessScore >= 80) {
        return '回復マーカーは良好です。今日の優先習慣とメインワークアウトを進めましょう。';
      }
      if (readinessScore <= 50) {
        return '体は軽めの日を求めています。水分、食事の質、回復を優先しましょう。';
      }
      return '今日は中間ゾーンです。極端にならず、安定して続けることを優先しましょう。';
    }
    if (readinessScore >= 80) {
      return 'Your recovery markers look strong today. Push your priority habits and main workout.';
    }
    if (readinessScore <= 50) {
      return 'Your body is asking for a lighter day. Focus on water, food quality, and recovery.';
    }
    return 'You are in a workable middle zone today. Stay consistent and avoid all-or-nothing swings.';
  }

  private localizeMealAnalysisSummary(preferredLanguage: string) {
    return this.normalizeLanguage(preferredLanguage) === 'ja'
      ? '写真から食事を推定し、今日の記録に反映しました。'
      : 'Estimated from the uploaded meal image and logged as a balanced custom meal.';
  }

  private localizeMealSummaryByKey(key: 'salad' | 'burger' | 'rice', preferredLanguage: string) {
    if (this.normalizeLanguage(preferredLanguage) !== 'ja') {
      switch (key) {
        case 'salad':
          return 'Estimated as a lean salad-style meal with a protein-forward macro split.';
        case 'burger':
          return 'Estimated as a higher-calorie comfort meal, so the rest of the day should stay lighter.';
        case 'rice':
          return 'Estimated as a carb-forward meal with moderate protein.';
      }
    }

    switch (key) {
      case 'salad':
        return '高たんぱく寄りの軽めサラダボウルとして推定しました。';
      case 'burger':
        return '高カロリー寄りの食事として推定したため、残りは軽めに整える想定です。';
      case 'rice':
        return '炭水化物がやや多めで、たんぱく質は中程度の食事として推定しました。';
    }
  }

  private localizeMealNameByKey(key: string, preferredLanguage: string) {
    if (this.normalizeLanguage(preferredLanguage) !== 'ja') {
      switch (key) {
        case 'chicken-salad-bowl':
          return 'Chicken Salad Bowl';
        case 'burger-meal':
          return 'Burger Meal';
        case 'rice-meal':
          return 'Rice-Based Meal';
        default:
          return 'Analyzed Meal';
      }
    }

    switch (key) {
      case 'chicken-salad-bowl':
        return 'チキンサラダボウル';
      case 'burger-meal':
        return 'バーガーミール';
      case 'rice-meal':
        return 'ライス系ミール';
      default:
        return '解析済みミール';
    }
  }

  private localizeReplanReason(kind: 'aligned' | 'rebalanced' | 'lighter-protein', preferredLanguage: string) {
    if (this.normalizeLanguage(preferredLanguage) !== 'ja') {
      switch (kind) {
        case 'aligned':
          return 'Adjusted to keep the rest of the day aligned with your target intake.';
        case 'rebalanced':
          return 'Rebalanced around what you have already logged today.';
        case 'lighter-protein':
        default:
          return 'Keeps the remaining meals lighter and higher in protein.';
      }
    }

    switch (kind) {
      case 'aligned':
        return '今日の目標摂取量に近づけるため、残りの食事を調整しました。';
      case 'rebalanced':
        return 'すでに記録した内容を踏まえて、残りを再調整しています。';
      case 'lighter-protein':
      default:
        return '残りは軽めで、たんぱく質を確保しやすい構成にしています。';
    }
  }

  private localizeNoMealsToReplan(preferredLanguage: string) {
    return this.normalizeLanguage(preferredLanguage) === 'ja'
      ? '今日の予定食はすでにすべて記録済みのため、再プランする項目はありません。'
      : 'All planned meals are already logged today, so there is nothing left to re-plan.';
  }

  private localizeHabitName(name: string, preferredLanguage: string) {
    if (this.normalizeLanguage(preferredLanguage) !== 'ja') {
      return name;
    }

    switch (name) {
      case 'Morning Sunlight':
        return '朝の日光';
      case 'Meditation':
        return '瞑想';
      case 'Stretching':
        return 'ストレッチ';
      case 'Hydration Check':
        return '水分チェック';
      default:
        return name;
    }
  }

  private async ensureDailyMetric(
    userId: string,
    profile?: {
      weightKg: number | null;
      goals: string[];
      heightCm: number | null;
      age: number | null;
      gender: Gender | null;
      preferredLanguage?: string | null;
      activityLevel: string | null;
      planDuration: string | null;
      targetWeightChangeKg: number | null;
      targetTimeframe: string | null;
    } | null
  ) {
    const { start } = this.getDayBounds();
    const existing = await this.prisma.dailyMetric.findFirst({
      where: { userId, date: start }
    });
    if (existing) {
      return existing;
    }

    const resolvedProfile =
      profile ??
      (await this.prisma.userProfile.findUnique({
        where: { userId }
      }));
    const targets = this.calculateTargets({
      age: resolvedProfile?.age ?? 25,
      gender: (resolvedProfile?.gender ?? 'MALE') as 'MALE' | 'FEMALE' | 'OTHER',
      heightCm: resolvedProfile?.heightCm ?? 170,
      weightKg: resolvedProfile?.weightKg ?? 65,
      goals: resolvedProfile?.goals ?? [],
      activityLevel: resolvedProfile?.activityLevel ?? 'moderate',
      planDuration: resolvedProfile?.planDuration ?? '30 days',
      targetWeightChangeKg: resolvedProfile?.targetWeightChangeKg ?? 0,
      targetTimeframe: resolvedProfile?.targetTimeframe ?? '30 days'
    }, this.normalizeLanguage(resolvedProfile?.preferredLanguage ?? 'ja'));

    return this.prisma.dailyMetric.create({
      data: {
        userId,
        date: start,
        caloriesTarget: targets.caloriesTarget,
        proteinTarget: targets.proteinTarget,
        carbsTarget: targets.carbsTarget,
        fatTarget: targets.fatTarget,
        waterTargetLiters: targets.waterTargetLiters,
        nutritionInsight: targets.nutritionInsight
      }
    });
  }

  private calculateTargets(dto: {
    age: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    heightCm: number;
    weightKg: number;
    goals: string[];
    activityLevel: string;
    planDuration: string;
    targetWeightChangeKg: number;
    targetTimeframe: string;
  }, preferredLanguage = 'ja') {
    let bmr = 10 * dto.weightKg + 6.25 * dto.heightCm - 5 * dto.age;
    bmr += dto.gender === 'MALE' ? 5 : dto.gender === 'FEMALE' ? -161 : -70;

    const activityMultiplier =
      dto.activityLevel === 'sedentary'
        ? 1.2
        : dto.activityLevel === 'light'
          ? 1.375
          : dto.activityLevel === 'active' || dto.activityLevel === 'very active'
            ? 1.725
            : 1.55;

    let caloriesTarget = Math.round(bmr * activityMultiplier);
    if (dto.targetWeightChangeKg < 0 || dto.goals.includes('fat-loss')) caloriesTarget -= 400;
    if (dto.targetWeightChangeKg > 0 || dto.goals.includes('muscle')) caloriesTarget += 250;

    const proteinTarget = Math.round(dto.weightKg * 1.8);
    const fatTarget = Math.round((caloriesTarget * 0.25) / 9);
    const carbsTarget = Math.max(80, Math.round((caloriesTarget - proteinTarget * 4 - fatTarget * 9) / 4));
    const waterTargetLiters = Math.max(2, Math.round(dto.weightKg * 0.035 * 10) / 10);

    const language = this.normalizeLanguage(preferredLanguage);
    return {
      caloriesTarget,
      proteinTarget,
      carbsTarget,
      fatTarget,
      waterTargetLiters,
      nutritionInsight:
        dto.targetWeightChangeKg < 0
          ? language === 'ja'
            ? '適度なカロリー赤字を保ちつつ、回復のためのたんぱく質を確保する設計です。'
            : 'This plan keeps you in a moderate calorie deficit while protecting protein intake for recovery.'
          : dto.targetWeightChangeKg > 0
            ? language === 'ja'
              ? '筋力トレーニングと筋量アップを支えるため、穏やかな余剰カロリーを設定しています。'
              : 'This plan adds a controlled calorie surplus to support training and muscle gain.'
            : language === 'ja'
              ? '維持をベースに、無理なく安定した摂取バランスを目指す設計です。'
              : 'This plan is designed to keep intake balanced and consistent around maintenance.'
    };
  }

  private buildWelcomeMessage(dto: CompleteOnboardingDto, preferredLanguage = 'ja') {
    const name = dto.name?.trim() || 'there';
    const goals = dto.goals.length > 0 ? dto.goals.join(', ') : 'healthy consistency';
    if (this.normalizeLanguage(preferredLanguage) === 'ja') {
      return `${name}さん、${dto.planDuration}のプランができました。回復、水分補給、そして続けやすい安定した前進に集中していきましょう。`;
    }
    return `Hi ${name}, your ${dto.planDuration} plan is ready. We will focus on ${goals} with steady progress you can actually maintain.`;
  }

  private buildDefaultHabits(preferredLanguage = 'ja') {
    const language = this.normalizeLanguage(preferredLanguage);
    return [
      { name: language === 'ja' ? '朝の日光' : 'Morning Sunlight', icon: 'sun', isWaterHabit: false },
      { name: language === 'ja' ? '瞑想' : 'Meditation', icon: 'brain', isWaterHabit: false },
      { name: language === 'ja' ? 'ストレッチ' : 'Stretching', icon: 'activity', isWaterHabit: false },
      { name: language === 'ja' ? '水分チェック' : 'Hydration Check', icon: 'droplets', isWaterHabit: true }
    ];
  }

  private buildDefaultMeals(caloriesTarget: number, preferredLanguage = 'ja') {
    const language = this.normalizeLanguage(preferredLanguage);
    const breakfastCalories = Math.round(caloriesTarget * 0.25);
    const lunchCalories = Math.round(caloriesTarget * 0.35);
    const dinnerCalories = Math.round(caloriesTarget * 0.3);
    const snackCalories = caloriesTarget - breakfastCalories - lunchCalories - dinnerCalories;

    return [
      {
        mealType: MealType.BREAKFAST,
        name: language === 'ja' ? 'ギリシャヨーグルトボウル' : 'Greek Yogurt Bowl',
        calories: breakfastCalories,
        protein: 28,
        carbs: 35,
        fat: 12,
        reason: language === 'ja'
            ? '朝の食欲を安定させる高たんぱく朝食です。'
            : 'High-protein breakfast to stabilize appetite early in the day.'
      },
      {
        mealType: MealType.LUNCH,
        name: language === 'ja' ? 'チキンライスパワーボウル' : 'Chicken Rice Power Bowl',
        calories: lunchCalories,
        protein: 42,
        carbs: 48,
        fat: 16,
        reason: language === 'ja'
            ? 'エネルギーと満足感を保ちやすいバランスのよい昼食です。'
            : 'Balanced lunch for energy, satiety, and easy adherence.'
      },
      {
        mealType: MealType.DINNER,
        name: language === 'ja' ? 'サーモンとグリーンのプレート' : 'Salmon and Greens Plate',
        calories: dinnerCalories,
        protein: 38,
        carbs: 30,
        fat: 18,
        reason: language === 'ja'
            ? '良質な脂質と適度な炭水化物で回復を支える夕食です。'
            : 'Recovery-focused dinner with quality fats and moderate carbs.'
      },
      {
        mealType: MealType.SNACK,
        name: language === 'ja' ? 'フルーツとプロテインスナック' : 'Fruit and Protein Snack',
        calories: snackCalories,
        protein: 18,
        carbs: 24,
        fat: 8,
        reason: language === 'ja'
            ? '1日の目標に近づけるための調整しやすい間食です。'
            : 'Flexible snack to help you land near your daily targets.'
      }
    ];
  }

  private buildWorkout(
    dto: Pick<CompleteOnboardingDto, 'targetWeightChangeKg' | 'activityPrefs'>,
    focus?: string,
    preferredLanguage = 'ja'
  ) {
    const language = this.normalizeLanguage(preferredLanguage);
    const normalizedFocus = focus?.trim().toLowerCase() ?? dto.activityPrefs?.[0]?.trim().toLowerCase() ?? '';
    const lowerIntensity = dto.targetWeightChangeKg < 0 ? 'Moderate' : 'Moderate-High';
    if (normalizedFocus.includes('mobility') || normalizedFocus.includes('recovery')) {
      return {
        title: language === 'ja' ? 'モビリティ回復フロー' : 'Mobility Recovery Flow',
        duration: '30 min',
        intensity: language === 'ja' ? '軽め〜中程度' : 'Light-Moderate',
        calories: '180 kcal',
        exercises: [
          { slug: 'worlds-greatest-stretch', name: language === 'ja' ? 'ワールズグレイテストストレッチ' : 'Worlds Greatest Stretch', sets: 2, reps: '8 / side' },
          { slug: 'glute-bridge', name: language === 'ja' ? 'グルートブリッジ' : 'Glute Bridge', sets: 3, reps: '15' },
          { slug: 'bird-dog', name: language === 'ja' ? 'バードドッグ' : 'Bird Dog', sets: 3, reps: '10 / side' },
          { slug: 'dead-bug', name: language === 'ja' ? 'デッドバグ' : 'Dead Bug', sets: 3, reps: '12' }
        ]
      };
    }
    if (normalizedFocus.includes('walking') || normalizedFocus.includes('cardio')) {
      return {
        title: language === 'ja' ? '有酸素ベースビルダー' : 'Cardio Base Builder',
        duration: '35 min',
        intensity: language === 'ja' ? '中程度' : 'Moderate',
        calories: '240 kcal',
        exercises: [
          { slug: 'brisk-walk', name: language === 'ja' ? '早歩き' : 'Brisk Walk', sets: 1, reps: '20 min' },
          { slug: 'step-up', name: language === 'ja' ? 'ステップアップ' : 'Step-Up', sets: 3, reps: '12 / side' },
          { slug: 'bodyweight-squat', name: language === 'ja' ? '自重スクワット' : 'Bodyweight Squat', sets: 3, reps: '15' },
          { slug: 'mountain-climber', name: language === 'ja' ? 'マウンテンクライマー' : 'Mountain Climber', sets: 3, reps: '30s' }
        ]
      };
    }

    return {
      title: language === 'ja' ? '全身ファウンデーション' : 'Full Body Foundation',
      duration: '40 min',
      intensity: language === 'ja' ? (dto.targetWeightChangeKg < 0 ? '中程度' : '中程度〜やや高め') : lowerIntensity,
      calories: dto.targetWeightChangeKg < 0 ? '280 kcal' : '340 kcal',
      exercises: [
        { slug: 'goblet-squat', name: language === 'ja' ? 'ゴブレットスクワット' : 'Goblet Squat', sets: 3, reps: '12' },
        { slug: 'push-up', name: language === 'ja' ? 'プッシュアップ' : 'Push-Up', sets: 3, reps: '10' },
        { slug: 'dumbbell-row', name: language === 'ja' ? 'ダンベルロウ' : 'Dumbbell Row', sets: 3, reps: '12' },
        { slug: 'front-plank', name: language === 'ja' ? 'フロントプランク' : 'Front Plank', sets: 3, reps: '45s' }
      ]
    };
  }

  private getDayBounds() {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  private async updateBadgeProgress(userId: string, metric: { waterConsumedLiters: Prisma.Decimal; waterTargetLiters: Prisma.Decimal; gems: number }) {
    const progressUpdates: Array<Promise<unknown>> = [];
    if (Number(metric.waterConsumedLiters) >= Number(metric.waterTargetLiters)) {
      progressUpdates.push(
        this.prisma.badgeProgress.updateMany({
          where: { userId, code: 'water-warrior' },
          data: { progress: { increment: 1 }, unlocked: true }
        })
      );
    }
    progressUpdates.push(
      this.prisma.badgeProgress.updateMany({
        where: { userId, code: 'consistency-king' },
        data: { progress: Math.floor(metric.gems / 10) }
      })
    );
    await Promise.all(progressUpdates);
  }

  private toRewardSummary(
    gems: number,
    badges: Array<{ code: string; unlocked: boolean; progress: number }>
  ): RewardSummary {
    return {
      gems,
      badges: badges.map((badge) => ({
        code: badge.code,
        unlocked: badge.unlocked,
        progress: badge.progress
      }))
    };
  }
}
