import { IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

enum MealTypeDto {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK'
}

export class ReplanMealsDto {
  @IsOptional()
  @IsString()
  @MaxLength(240)
  notes?: string;
}

export class AnalyzeMealImageDto {
  @IsOptional()
  @IsEnum(MealTypeDto)
  mealType?: MealTypeDto;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;

  @ValidateIf((value: AnalyzeMealImageDto) => !value.notes)
  @IsString()
  base64Data!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  notes?: string;
}
