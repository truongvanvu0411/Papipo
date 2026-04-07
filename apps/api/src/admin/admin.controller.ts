import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { AuthService } from '../auth/auth.service.js';
import { LoginDto } from '../auth/dto/login.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { AdminService } from './admin.service.js';
import { AdminUserQueryDto } from './dto/admin-user-query.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';

@Controller('admin')
export class AdminController {
  private readonly adminService: AdminService;
  private readonly authService: AuthService;

  constructor(
    adminService: AdminService,
    authService: AuthService
  ) {
    this.adminService = adminService;
    this.authService = authService;
  }

  @Post('auth/login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto, UserRole.ADMIN);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('dashboard/overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users')
  listUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.listUsersWithQuery(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users/:id')
  getUserDetail(@Param('id') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('users/:id/status')
  updateUserStatus(
    @Param('id') userId: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() request: AuthenticatedRequest
  ) {
    return this.adminService.updateUserStatus(request.user!.sub, userId, dto.status as UserStatus);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users/:id/activity')
  getUserActivity(@Param('id') userId: string) {
    return this.adminService.getUserActivity(userId);
  }
}
