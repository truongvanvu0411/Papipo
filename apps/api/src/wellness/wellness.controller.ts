import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto.js';
import { CreateCustomMealLogDto, CreateMealLogDto } from './dto/create-meal-log.dto.js';
import {
  CreateDailyCheckInDto,
  CreateInitialDailyCheckInDto
} from './dto/create-daily-check-in.dto.js';
import { LogWaterDto } from './dto/log-water.dto.js';
import { AnalyzeMealImageDto, ReplanMealsDto } from './dto/meal-ai.dto.js';
import { CompleteWorkoutDto, RegenerateWorkoutDto } from './dto/regenerate-workout.dto.js';
import { WellnessService } from './wellness.service.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class WellnessController {
  private readonly wellnessService: WellnessService;

  constructor(wellnessService: WellnessService) {
    this.wellnessService = wellnessService;
  }

  @Post('onboarding/complete')
  completeOnboarding(@Req() request: AuthenticatedRequest, @Body() dto: CompleteOnboardingDto) {
    return this.wellnessService.completeOnboarding(request.user!.sub, dto);
  }

  @Get('dashboard/today')
  getTodayDashboard(@Req() request: AuthenticatedRequest) {
    return this.wellnessService.getTodayDashboard(request.user!.sub);
  }

  @Post('daily-checkins/initial')
  createInitialCheckIn(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateInitialDailyCheckInDto
  ) {
    return this.wellnessService.createInitialCheckIn(request.user!.sub, dto);
  }

  @Post('daily-checkins')
  createDailyCheckIn(@Req() request: AuthenticatedRequest, @Body() dto: CreateDailyCheckInDto) {
    return this.wellnessService.createDailyCheckIn(request.user!.sub, dto);
  }

  @Post('water-logs')
  logWater(@Req() request: AuthenticatedRequest, @Body() dto: LogWaterDto) {
    return this.wellnessService.logWater(request.user!.sub, dto);
  }

  @Post('habit-logs/:habitId/toggle')
  toggleHabit(@Req() request: AuthenticatedRequest, @Param('habitId') habitId: string) {
    return this.wellnessService.toggleHabit(request.user!.sub, habitId);
  }

  @Get('rewards')
  getRewards(@Req() request: AuthenticatedRequest) {
    return this.wellnessService.getRewards(request.user!.sub);
  }

  @Get('meal-plans/today')
  getTodayMealPlan(@Req() request: AuthenticatedRequest) {
    return this.wellnessService.getTodayMealPlan(request.user!.sub);
  }

  @Post('meal-logs')
  logMeal(@Req() request: AuthenticatedRequest, @Body() dto: CreateMealLogDto) {
    return this.wellnessService.logMeal(request.user!.sub, dto);
  }

  @Post('meal-logs/custom')
  logCustomMeal(@Req() request: AuthenticatedRequest, @Body() dto: CreateCustomMealLogDto) {
    return this.wellnessService.logCustomMeal(request.user!.sub, dto);
  }

  @Post('meal-analysis/image')
  analyzeMealImage(@Req() request: AuthenticatedRequest, @Body() dto: AnalyzeMealImageDto) {
    return this.wellnessService.analyzeMealImage(request.user!.sub, dto);
  }

  @Post('meal-plans/replan')
  replanMeals(@Req() request: AuthenticatedRequest, @Body() dto: ReplanMealsDto) {
    return this.wellnessService.replanMeals(request.user!.sub, dto);
  }

  @Get('workout-plans/today')
  getTodayWorkout(@Req() request: AuthenticatedRequest) {
    return this.wellnessService.getTodayWorkoutPlan(request.user!.sub);
  }

  @Post('workout-plans/regenerate')
  regenerateWorkout(@Req() request: AuthenticatedRequest, @Body() dto: RegenerateWorkoutDto) {
    return this.wellnessService.regenerateWorkoutPlan(request.user!.sub, dto);
  }

  @Post('workouts/complete')
  completeWorkout(@Req() request: AuthenticatedRequest, @Body() dto: CompleteWorkoutDto) {
    return this.wellnessService.completeWorkout(request.user!.sub, dto);
  }
}
