import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

enum MealTypeDto {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK'
}

export class CreateMealLogDto {
  @IsOptional()
  @IsString()
  mealPlanId?: string;

  @IsOptional()
  @IsEnum(MealTypeDto)
  mealType?: MealTypeDto;

  @IsOptional()
  @IsString()
  source?: string;
}

export class CreateCustomMealLogDto {
  @IsEnum(MealTypeDto)
  mealType!: MealTypeDto;

  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  @Max(4000)
  calories!: number;

  @IsInt()
  @Min(0)
  @Max(500)
  protein!: number;

  @IsInt()
  @Min(0)
  @Max(500)
  carbs!: number;

  @IsInt()
  @Min(0)
  @Max(300)
  fat!: number;

  @IsOptional()
  @IsString()
  source?: string;
}
