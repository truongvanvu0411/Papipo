import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateInitialDailyCheckInDto {
  @IsString()
  selectedState!: string;
}

export class CreateDailyCheckInDto {
  @IsNumber()
  @Min(3)
  @Max(12)
  sleepHours!: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  sleepQuality!: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  soreness!: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  stress!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
