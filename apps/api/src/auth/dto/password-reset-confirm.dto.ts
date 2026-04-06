import { IsString, Matches, MinLength } from 'class-validator';

export class PasswordResetConfirmDto {
  @IsString()
  @MinLength(20)
  token!: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'password must include at least one uppercase letter' })
  @Matches(/[a-z]/, { message: 'password must include at least one lowercase letter' })
  @Matches(/[0-9]/, { message: 'password must include at least one number' })
  password!: string;
}
