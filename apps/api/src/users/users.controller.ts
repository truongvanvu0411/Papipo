import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  private readonly usersService: UsersService;

  constructor(usersService: UsersService) {
    this.usersService = usersService;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() request: AuthenticatedRequest) {
    return this.usersService.getCurrentUser(request.user!.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() request: AuthenticatedRequest, @Body() dto: UpdateUserProfileDto) {
    return this.usersService.updateCurrentUser(request.user!.sub, dto);
  }
}
