import { IsOptional, IsString } from 'class-validator';

export class RegenerateWorkoutDto {
  @IsOptional()
  @IsString()
  focus?: string;
}

export class CompleteWorkoutDto {
  @IsOptional()
  @IsString()
  workoutPlanId?: string;
}
