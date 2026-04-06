import { jest } from '@jest/globals';
import { AdminService } from './admin.service.js';

describe('AdminService', () => {
  const prisma = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn()
    },
    dailyCheckIn: {
      findMany: jest.fn()
    },
    mealLog: {
      findMany: jest.fn()
    },
    workoutPlan: {
      findMany: jest.fn()
    },
    aiConversation: {
      findMany: jest.fn()
    },
    adminAuditLog: {
      findMany: jest.fn()
    }
  } as any;

  const service = new AdminService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns overview totals with recent users', async () => {
    prisma.user.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        email: 'first@example.com',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        profile: {
          name: 'First',
          preferredLanguage: 'ja',
          goals: ['fat-loss'],
          activityLevel: 'moderate',
          planDuration: '30 days'
        },
        dailyMetrics: [{ date: new Date('2026-04-05T00:00:00.000Z') }]
      }
    ]);

    const result = await service.getOverview();

    expect(result.totals.users).toBe(10);
    expect(result.recentUsers).toHaveLength(1);
  });

  it('returns rich activity including workouts and ai conversations', async () => {
    prisma.dailyCheckIn.findMany.mockResolvedValue([
      {
        id: 'check-1',
        date: new Date('2026-04-05T00:00:00.000Z'),
        readinessScore: 78,
        sleepScore: 82,
        insight: 'Solid day'
      }
    ]);
    prisma.mealLog.findMany.mockResolvedValue([
      {
        id: 'meal-1',
        date: new Date('2026-04-05T12:00:00.000Z'),
        name: 'Lunch bowl',
        calories: 560,
        mealType: 'LUNCH',
        source: 'meal-plan'
      }
    ]);
    prisma.workoutPlan.findMany.mockResolvedValue([
      {
        id: 'workout-1',
        date: new Date('2026-04-05T00:00:00.000Z'),
        title: 'Full Body Foundation',
        completedAt: new Date('2026-04-05T08:30:00.000Z'),
        exercises: [
          {
            id: 'exercise-1',
            slug: 'push-up',
            name: 'Push-Up',
            sets: 3,
            reps: '10',
            position: 0
          }
        ]
      }
    ]);
    prisma.aiConversation.findMany.mockResolvedValue([
      {
        id: 'conversation-1',
        title: 'Sleep help',
        updatedAt: new Date('2026-04-05T09:00:00.000Z'),
        messages: [
          {
            id: 'message-2',
            conversationId: 'conversation-1',
            role: 'ASSISTANT',
            content: 'Wind down earlier tonight.',
            createdAt: new Date('2026-04-05T09:00:00.000Z')
          },
          {
            id: 'message-1',
            conversationId: 'conversation-1',
            role: 'USER',
            content: 'I feel tired.',
            createdAt: new Date('2026-04-05T08:59:00.000Z')
          }
        ]
      }
    ]);
    prisma.adminAuditLog.findMany.mockResolvedValue([]);

    const result = await service.getUserActivity('user-1');

    expect(result.workouts[0]?.exercises).toHaveLength(1);
    expect(result.aiConversations[0]?.lastMessagePreview).toBe('Wind down earlier tonight.');
    expect(result.aiConversations[0]?.messages[0]?.role).toBe('USER');
  });
});
