import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { AiService } from './ai.service.js';
import { CoachChatDto } from './dto/coach-chat.dto.js';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('conversations')
  listConversations(@Req() request: AuthenticatedRequest) {
    return this.aiService.listConversations(request.user!.sub);
  }

  @Get('conversations/:id/messages')
  getConversationMessages(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.aiService.getConversationMessages(request.user!.sub, id);
  }

  @Post('coach/chat')
  chat(@Req() request: AuthenticatedRequest, @Body() dto: CoachChatDto) {
    return this.aiService.chat(request.user!.sub, dto);
  }
}
