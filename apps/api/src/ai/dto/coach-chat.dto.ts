import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CoachChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}
