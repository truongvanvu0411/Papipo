import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator';

enum GenderDto {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(13)
  @Max(100)
  age?: number;

  @IsOptional()
  @IsEnum(GenderDto)
  gender?: GenderDto;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(300)
  weightKg?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  goals?: string[];

  @IsOptional()
  @IsString()
  activityLevel?: string;

  @IsOptional()
  @IsString()
  planDuration?: string;

  @IsOptional()
  @IsInt()
  targetWeightChangeKg?: number;

  @IsOptional()
  @IsString()
  targetTimeframe?: string;

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
