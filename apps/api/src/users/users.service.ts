import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { WellnessService } from '../wellness/wellness.service.js';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wellnessService: WellnessService
  ) {}

  async getCurrentUser(userId: string) {
    return this.wellnessService.getUserProfile(userId);
  }

  async updateCurrentUser(userId: string, dto: UpdateUserProfileDto) {
    return this.wellnessService.updateUserProfile(userId, dto);
  }
}
