import { Injectable } from '@nestjs/common';
import type {
  AdminDashboardOverview,
  AdminUserActivity,
  AdminUserDetail,
  AdminUserListItem
} from '@papipo/contracts';
import { UserRole, UserStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminUserQueryDto } from './dto/admin-user-query.dto.js';

@Injectable()
export class AdminService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async getOverview(): Promise<AdminDashboardOverview> {
    const [users, activeUsers, suspendedUsers, admins, recentUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          profile: true,
          dailyMetrics: {
            orderBy: { date: 'desc' },
            take: 1
          }
        }
      })
    ]);

    return {
      totals: {
        users,
        activeUsers,
        suspendedUsers,
        admins
      },
      recentUsers: recentUsers.map((user) => this.toAdminListItem(user))
    };
  }

  async listUsers(): Promise<AdminUserListItem[]> {
    return this.listUsersWithQuery({});
  }

  async listUsersWithQuery(query: Partial<AdminUserQueryDto>): Promise<AdminUserListItem[]> {
    const where: Prisma.UserWhereInput = {
      status: query.status,
      role: query.role,
      OR: query.search
        ? [
            { email: { contains: query.search, mode: 'insensitive' } },
            { profile: { is: { name: { contains: query.search, mode: 'insensitive' } } } }
          ]
        : undefined
    };

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const users = await this.prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc'
      },
      include: {
        profile: true,
        dailyMetrics: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });

    return users.map((user) => this.toAdminListItem(user));
  }

  async getUserDetail(userId: string): Promise<AdminUserDetail> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        profile: true,
        dailyMetrics: {
          orderBy: { date: 'desc' },
          take: 1
        },
        dailyCheckIns: {
          orderBy: { date: 'desc' },
          take: 1
        },
        workoutPlans: {
          orderBy: { date: 'desc' },
          take: 1,
          include: {
            exercises: {
              orderBy: { position: 'asc' }
            }
          }
        }
      }
    });

    const latestMetric = user.dailyMetrics[0] ?? null;
    const latestCheckIn = user.dailyCheckIns[0] ?? null;
    const latestWorkout = user.workoutPlans[0] ?? null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
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
            aiWelcomeMessage: user.profile.aiWelcomeMessage
            ,
            isOnboarded: user.profile.isOnboarded,
            lastCheckInDate: user.profile.lastCheckInDate?.toISOString() ?? null
          }
        : null,
      latestMetric: latestMetric
        ? {
            date: latestMetric.date.toISOString(),
            readiness: latestMetric.readiness,
            sleepScore: latestMetric.sleepScore,
            caloriesConsumed: latestMetric.caloriesConsumed,
            caloriesTarget: latestMetric.caloriesTarget,
            waterConsumedLiters: Number(latestMetric.waterConsumedLiters),
            waterTargetLiters: Number(latestMetric.waterTargetLiters),
            gems: latestMetric.gems,
            dailyInsight: latestMetric.dailyInsight
          }
        : null,
      latestCheckIn: latestCheckIn
        ? {
            date: latestCheckIn.date.toISOString(),
            sleepHours: Number(latestCheckIn.sleepHours),
            sleepQuality: latestCheckIn.sleepQuality,
            soreness: latestCheckIn.soreness,
            stress: latestCheckIn.stress,
            readinessScore: latestCheckIn.readinessScore,
            sleepScore: latestCheckIn.sleepScore,
            insight: latestCheckIn.insight
          }
        : null,
      latestNutrition: latestMetric
        ? {
            date: latestMetric.date.toISOString(),
            nutritionInsight: latestMetric.nutritionInsight,
            caloriesConsumed: latestMetric.caloriesConsumed,
            proteinConsumed: latestMetric.proteinConsumed,
            carbsConsumed: latestMetric.carbsConsumed,
            fatConsumed: latestMetric.fatConsumed
          }
        : null,
      latestWorkout: latestWorkout
        ? {
            id: latestWorkout.id,
            date: latestWorkout.date.toISOString(),
            title: latestWorkout.title,
            duration: latestWorkout.duration,
            intensity: latestWorkout.intensity,
            calories: latestWorkout.calories,
            completedAt: latestWorkout.completedAt?.toISOString() ?? null,
            exercises: latestWorkout.exercises.map((exercise) => ({
              id: exercise.id,
              slug: exercise.slug,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              position: exercise.position
            }))
          }
        : null
    };
  }

  private toAdminListItem(user: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    profile: {
      name: string | null;
      preferredLanguage: string | null;
      isOnboarded: boolean;
      goals: string[];
      activityLevel: string | null;
      planDuration: string | null;
    } | null;
    dailyMetrics: Array<{ date: Date }>;
  }): AdminUserListItem {
    return {
      id: user.id,
      email: user.email,
      role: user.role as AdminUserListItem['role'],
      status: user.status as AdminUserListItem['status'],
      createdAt: user.createdAt.toISOString(),
      profile: user.profile
        ? {
            name: user.profile.name,
            preferredLanguage: user.profile.preferredLanguage,
            isOnboarded: user.profile.isOnboarded,
            goals: user.profile.goals,
            activityLevel: user.profile.activityLevel,
            planDuration: user.profile.planDuration
          }
        : null,
      latestMetricDate: user.dailyMetrics[0]?.date.toISOString() ?? null
    };
  }

  async updateUserStatus(actorUserId: string, userId: string, status: UserStatus) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status }
    });

    await this.prisma.adminAuditLog.create({
      data: {
        actorUserId,
        targetUserId: userId,
        action: 'USER_STATUS_UPDATED',
        metadata: { status }
      }
    });

    return {
      id: updated.id,
      status: updated.status
    };
  }

  async getUserActivity(userId: string): Promise<AdminUserActivity> {
    const [checkIns, mealLogs, workouts, aiConversations, auditTrail] = await Promise.all([
      this.prisma.dailyCheckIn.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 10
      }),
      this.prisma.mealLog.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 10
      }),
      this.prisma.workoutPlan.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 10,
        include: {
          exercises: {
            orderBy: { position: 'asc' }
          }
        }
      }),
      this.prisma.aiConversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 6
          }
        }
      }),
      this.prisma.adminAuditLog.findMany({
        where: { targetUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);

    return {
      checkIns: checkIns.map((item) => ({
        id: item.id,
        date: item.date.toISOString(),
        readinessScore: item.readinessScore,
        sleepScore: item.sleepScore,
        insight: item.insight
      })),
      mealLogs: mealLogs.map((item) => ({
        id: item.id,
        date: item.date.toISOString(),
        name: item.name,
        calories: item.calories,
        mealType: item.mealType
      })),
      workouts: workouts.map((item) => ({
        id: item.id,
        date: item.date.toISOString(),
        title: item.title,
        completedAt: item.completedAt?.toISOString() ?? null,
        exercises: item.exercises.map((exercise) => ({
          id: exercise.id,
          slug: exercise.slug,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          position: exercise.position
        }))
      })),
      aiConversations: aiConversations.map((item) => ({
        id: item.id,
        title: item.title,
        updatedAt: item.updatedAt.toISOString(),
        lastMessagePreview: item.messages[0]?.content ?? null,
        messages: [...item.messages]
          .reverse()
          .map((message) => ({
            id: message.id,
            conversationId: message.conversationId,
            role: message.role,
            content: message.content,
            createdAt: message.createdAt.toISOString()
          }))
      })),
      auditTrail: auditTrail.map((item) => ({
        id: item.id,
        action: item.action,
        createdAt: item.createdAt.toISOString(),
        metadata: (item.metadata as Record<string, unknown> | null) ?? null
      }))
    };
  }
}
