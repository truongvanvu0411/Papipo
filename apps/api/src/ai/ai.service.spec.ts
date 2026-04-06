import { ConfigService } from '@nestjs/config';
import { jest } from '@jest/globals';
import { AiMessageRole } from '@prisma/client';
import { AiService } from './ai.service.js';

describe('AiService', () => {
  const prisma = {
    aiConversation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn()
    },
    aiMessage: {
      create: jest.fn()
    },
    dailyMetric: {
      findFirst: jest.fn()
    },
    userProfile: {
      findUnique: jest.fn()
    }
  } as any;

  const configService = {
    get: jest.fn((_key: string, fallback?: string) => fallback ?? '')
  } as unknown as ConfigService;

  const service = new AiService(prisma, configService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a conversation and stores user/assistant messages', async () => {
    prisma.aiConversation.findFirst.mockResolvedValue(null);
    prisma.aiConversation.create.mockResolvedValue({
      id: 'conversation-1',
      userId: 'user-1',
      title: 'Need help with sleep',
      createdAt: new Date('2026-04-06T00:00:00.000Z'),
      updatedAt: new Date('2026-04-06T00:00:00.000Z'),
      messages: []
    });
    prisma.aiMessage.create
      .mockResolvedValueOnce({
        id: 'message-1',
        conversationId: 'conversation-1',
        role: AiMessageRole.USER,
        content: 'Need help with sleep',
        createdAt: new Date('2026-04-06T00:01:00.000Z')
      })
      .mockResolvedValueOnce({
        id: 'message-2',
        conversationId: 'conversation-1',
        role: AiMessageRole.ASSISTANT,
        content: 'Fallback coach reply',
        createdAt: new Date('2026-04-06T00:01:05.000Z')
      });
    prisma.dailyMetric.findFirst.mockResolvedValue({
      readiness: 48,
      sleepScore: 52,
      caloriesConsumed: 900,
      caloriesTarget: 1800,
      waterConsumedLiters: 0.8,
      waterTargetLiters: 2.3
    });
    prisma.userProfile.findUnique.mockResolvedValue({
      preferredLanguage: 'en',
      goals: ['better-sleep']
    });
    prisma.aiConversation.findUniqueOrThrow.mockResolvedValue({
      id: 'conversation-1',
      title: 'Need help with sleep',
      createdAt: new Date('2026-04-06T00:00:00.000Z'),
      updatedAt: new Date('2026-04-06T00:01:05.000Z'),
      messages: [
        {
          id: 'message-1',
          conversationId: 'conversation-1',
          role: AiMessageRole.USER,
          content: 'Need help with sleep',
          createdAt: new Date('2026-04-06T00:01:00.000Z')
        },
        {
          id: 'message-2',
          conversationId: 'conversation-1',
          role: AiMessageRole.ASSISTANT,
          content: 'Fallback coach reply',
          createdAt: new Date('2026-04-06T00:01:05.000Z')
        }
      ]
    });

    const result = await service.chat('user-1', {
      message: 'Need help with sleep'
    });

    expect(prisma.aiConversation.create).toHaveBeenCalled();
    expect(prisma.aiMessage.create).toHaveBeenCalledTimes(2);
    expect(result.conversation.id).toBe('conversation-1');
    expect(result.messages).toHaveLength(2);
    expect(result.messages[1]?.role).toBe('ASSISTANT');
  });

  it('rate limits repeated coach requests per user', async () => {
    const limitedService = new AiService(prisma, configService);
    const enforceRateLimit = (limitedService as any).enforceRateLimit.bind(limitedService);

    for (let index = 0; index < 8; index += 1) {
      expect(() => enforceRateLimit('user-rate-limit')).not.toThrow();
    }

    expect(() => enforceRateLimit('user-rate-limit')).toThrow(
      'AI coach is temporarily rate-limited'
    );
  });

  it('sanitizes emails and phone numbers before provider calls', () => {
    const sanitized = (service as any).sanitizeForProvider(
      'Email me at coach@example.com or call +1 555 123 4567 tonight.'
    );

    expect(sanitized).toContain('[email]');
    expect(sanitized).toContain('[phone]');
    expect(sanitized).not.toContain('coach@example.com');
  });
});
