import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class LogWaterDto {
  @IsNumber()
  @Min(0.1)
  @Max(5)
  amountLiters!: number;

  @IsOptional()
  @IsString()
  sourceLabel?: string;
}
