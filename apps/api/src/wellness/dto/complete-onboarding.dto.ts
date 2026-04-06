import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

enum GenderDto {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

export class CompleteOnboardingDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsInt()
  @Min(13)
  @Max(100)
  age!: number;

  @IsEnum(GenderDto)
  gender!: GenderDto;

  @IsInt()
  @Min(100)
  @Max(250)
  heightCm!: number;

  @IsInt()
  @Min(30)
  @Max(300)
  weightKg!: number;

  @IsArray()
  @IsString({ each: true })
  goals!: string[];

  @IsString()
  activityLevel!: string;

  @IsString()
  planDuration!: string;

  @IsInt()
  targetWeightChangeKg!: number;

  @IsString()
  targetTimeframe!: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favoriteFoods?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activityPrefs?: string[];
}
