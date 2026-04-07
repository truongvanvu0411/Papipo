import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiChatResponse, AiConversationSummary, AiMessageView } from '@papipo/contracts';
import { AiMessageRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoachChatDto } from './dto/coach-chat.dto.js';

@Injectable()
export class AiService {
  private readonly messageWindows = new Map<string, number[]>();
  private readonly rateLimitWindowMs = 5 * 60 * 1000;
  private readonly maxMessagesPerWindow = 8;
  private readonly prisma: PrismaService;
  private readonly configService: ConfigService;

  constructor(
    prisma: PrismaService,
    configService: ConfigService
  ) {
    this.prisma = prisma;
    this.configService = configService;
  }

  async listConversations(userId: string): Promise<AiConversationSummary[]> {
    const conversations = await this.prisma.aiConversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      lastMessagePreview: conversation.messages[0]?.content ?? null
    }));
  }

  async getConversationMessages(userId: string, conversationId: string): Promise<AiMessageView[]> {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation.messages.map((message) => this.toMessageView(message));
  }

  async chat(userId: string, dto: CoachChatDto): Promise<AiChatResponse> {
    this.enforceRateLimit(userId);

    const conversation = dto.conversationId
      ? await this.prisma.aiConversation.findFirst({
          where: { id: dto.conversationId, userId },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 12
            }
          }
        })
      : null;

    if (dto.conversationId && !conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const activeConversation =
      conversation ??
      (await this.prisma.aiConversation.create({
        data: {
          userId,
          title: this.buildConversationTitle(dto.message)
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }));

    const userMessage = await this.prisma.aiMessage.create({
      data: {
        conversationId: activeConversation.id,
        role: AiMessageRole.USER,
        content: dto.message
      }
    });

    const assistantReply = await this.generateCoachReply(userId, dto.message, [
      ...activeConversation.messages,
      userMessage
    ]);

    const assistantMessage = await this.prisma.aiMessage.create({
      data: {
        conversationId: activeConversation.id,
        role: AiMessageRole.ASSISTANT,
        content: assistantReply
      }
    });

    if (!activeConversation.title || activeConversation.title.trim().length === 0) {
      await this.prisma.aiConversation.update({
        where: { id: activeConversation.id },
        data: {
          title: this.buildConversationTitle(dto.message)
        }
      });
    }

    const updatedConversation = await this.prisma.aiConversation.findUniqueOrThrow({
      where: { id: activeConversation.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return {
      conversation: {
        id: updatedConversation.id,
        title: updatedConversation.title,
        createdAt: updatedConversation.createdAt.toISOString(),
        updatedAt: updatedConversation.updatedAt.toISOString(),
        lastMessagePreview: assistantMessage.content
      },
      messages: updatedConversation.messages.map((message) => this.toMessageView(message))
    };
  }

  private async generateCoachReply(
    userId: string,
    latestMessage: string,
    messages: Array<{ role: AiMessageRole; content: string }>
  ) {
    const dashboard = await this.prisma.dailyMetric.findFirst({
      where: { userId },
      orderBy: { date: 'desc' }
    });
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId }
    });
    const language = profile?.preferredLanguage === 'vi' ? 'vi' : profile?.preferredLanguage === 'en' ? 'en' : 'ja';

    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    const provider = this.configService.get<string>('AI_PROVIDER', 'gemini');

    if (provider === 'gemini' && geminiKey && geminiKey.trim() !== '') {
      try {
        const context = this.buildProviderContext({
          preferredLanguage: profile?.preferredLanguage ?? 'ja',
          goals: profile?.goals ?? [],
          readiness: dashboard?.readiness ?? null,
          sleepScore: dashboard?.sleepScore ?? null,
          caloriesConsumed: dashboard?.caloriesConsumed ?? 0,
          caloriesTarget: dashboard?.caloriesTarget ?? 0,
          waterConsumed: dashboard?.waterConsumedLiters ?? 0,
          waterTarget: dashboard?.waterTargetLiters ?? 0,
          messages
        }, latestMessage);

        const response = await this.fetchGeminiJson(
          geminiKey,
          {
            contents: [
              {
                parts: [{ text: context }]
              }
            ]
          },
          2
        );

        if (response.ok) {
          const json = (await response.json()) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            return text;
          }
        }
      } catch {
        // Fall back to deterministic reply below.
      }
    }

    const guidance = [
      dashboard?.readiness != null && dashboard.readiness < 55
        ? language === 'ja'
          ? '今日は回復がやや低めなので、軽めの動きと水分補給を優先しましょう。'
          : 'Your recovery looks low today, so keep the plan lighter and prioritize hydration plus easier movement.'
        : dashboard?.readiness != null && dashboard.readiness >= 80
          ? language === 'ja'
            ? '今日は準備度が高いので、メインワークアウトとたんぱく質目標にしっかり寄せられます。'
            : 'Your readiness looks strong today, so you can lean into your main workout and protein target.'
          : language === 'ja'
            ? '今日はバランスが取れているので、強度より継続を優先しましょう。'
            : 'Your day looks balanced, so consistency matters more than intensity right now.',
      dashboard?.waterConsumedLiters != null && dashboard?.waterTargetLiters != null
        ? language === 'ja'
          ? `水分は現在 ${Number(dashboard.waterConsumedLiters).toFixed(1)}L / ${Number(
              dashboard.waterTargetLiters
            ).toFixed(1)}L です。`
          : `You are at ${Number(dashboard.waterConsumedLiters).toFixed(1)}L of ${Number(dashboard.waterTargetLiters).toFixed(1)}L water.`
        : null,
      dashboard?.caloriesConsumed != null && dashboard?.caloriesTarget != null
        ? language === 'ja'
          ? `摂取カロリーは ${dashboard.caloriesConsumed} / ${dashboard.caloriesTarget} kcal です。`
          : `You have logged ${dashboard.caloriesConsumed} of ${dashboard.caloriesTarget} calories today.`
        : null
    ]
      .filter((item): item is string => Boolean(item))
      .join(' ');

    if (language === 'ja') {
      return `状況は把握しました。${guidance} 次の一歩としては、${this.suggestNextAction(latestMessage, language)}。`;
    }
    return `I hear you. ${guidance} Based on what you asked, I would focus on one small next action: ${this.suggestNextAction(latestMessage, language)}.`;
  }

  private buildProviderContext(
    summary: {
      preferredLanguage: string;
      goals: string[];
      readiness: number | null;
      sleepScore: number | null;
      caloriesConsumed: number;
      caloriesTarget: number;
      waterConsumed: number | { toString(): string };
      waterTarget: number | { toString(): string };
      messages: Array<{ role: AiMessageRole; content: string }>;
    },
    latestMessage: string
  ) {
    const sanitizedHistory = summary.messages
      .slice(-6)
      .map((message) => `${message.role}: ${this.sanitizeForProvider(message.content)}`)
      .join('\n');

    return [
      'You are Papipo AI Coach. Reply in a warm, concise, actionable style.',
      'Keep the answer practical, supportive, and under 140 words unless the user asks for detail.',
      `Preferred language: ${summary.preferredLanguage}`,
      `Goals: ${summary.goals.join(', ') || 'general wellness'}`,
      `Readiness: ${summary.readiness ?? 'unknown'}`,
      `Sleep score: ${summary.sleepScore ?? 'unknown'}`,
      `Calories: ${summary.caloriesConsumed}/${summary.caloriesTarget}`,
      `Water: ${Number(summary.waterConsumed).toFixed(1)}/${Number(summary.waterTarget).toFixed(1)}`,
      `Recent messages: ${sanitizedHistory || 'none'}`,
      `User: ${this.sanitizeForProvider(latestMessage)}`
    ].join('\n');
  }

  private suggestNextAction(message: string, language = 'en') {
    const lowered = message.toLowerCase();
    if (lowered.includes('tired') || lowered.includes('sleep')) {
      return language === 'ja'
        ? '今夜は刺激を減らし、最後の食事を軽めにして、少し早めに休む準備をすること'
        : 'reduce tonight\'s stimulation, keep your last meal simple, and aim for an earlier wind-down';
    }
    if (lowered.includes('eat') || lowered.includes('meal') || lowered.includes('hungry')) {
      return language === 'ja'
        ? 'まずたんぱく質を中心に選び、エネルギーに応じて果物かご飯を足すこと'
        : 'choose a protein-first meal, then add fruit or rice depending on your energy';
    }
    if (lowered.includes('workout') || lowered.includes('train')) {
      return language === 'ja'
        ? '最初の種目だけ始めて、10分後にそのまま進めるか軽めにするか決めること'
        : 'start with the first exercise only, then decide after 10 minutes whether to progress or stay light';
    }
    if (lowered.includes('stress') || lowered.includes('anxious')) {
      return language === 'ja'
        ? '5分歩いて呼吸を整え、いちばん簡単な習慣から始めること'
        : 'take a five-minute walk, breathe slowly, and do the easiest habit on your list first';
    }
    return language === 'ja'
      ? '次の10分でできる最小の一歩を1つ決めて、それを先に終えること'
      : 'pick the smallest useful move you can do in the next 10 minutes and finish that first';
  }

  private buildConversationTitle(message: string) {
    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return 'AI Coach';
    }
    return trimmed.length <= 48 ? trimmed : `${trimmed.slice(0, 45)}...`;
  }

  private sanitizeForProvider(text: string) {
    return text
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
      .replace(/\+?\d[\d\s().-]{7,}\d/g, '[phone]')
      .replace(/\b\d{1,5}\s+[A-Za-z0-9.'-]+\s+(street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd)\b/gi, '[address]')
      .slice(0, 1200);
  }

  private async fetchGeminiJson(geminiKey: string, body: Record<string, unknown>, attempts: number) {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            signal: controller.signal
          }
        );

        clearTimeout(timeout);
        if (response.ok) {
          return response;
        }

        if (response.status < 500 && response.status !== 429) {
          return response;
        }

        lastError = new Error(`Gemini request failed with ${response.status}`);
      } catch (error) {
        clearTimeout(timeout);
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Gemini request failed');
  }

  private enforceRateLimit(userId: string) {
    const now = Date.now();
    const currentWindow = (this.messageWindows.get(userId) ?? []).filter(
      (timestamp) => now - timestamp < this.rateLimitWindowMs
    );

    if (currentWindow.length >= this.maxMessagesPerWindow) {
      throw new HttpException(
        'AI coach is temporarily rate-limited for this account. Please wait a few minutes and try again.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    currentWindow.push(now);
    this.messageWindows.set(userId, currentWindow);
  }

  private toMessageView(message: {
    id: string;
    conversationId: string;
    role: AiMessageRole;
    content: string;
    createdAt: Date;
  }): AiMessageView {
    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString()
    };
  }
}
