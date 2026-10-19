import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'One-time token from the reset email' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-f0-9]{64}$/, { message: 'token must be a valid reset token' })
  token: string;

  @ApiProperty({ minLength: 8, maxLength: 128, example: 'NewTest@123456' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'newPassword must contain uppercase, lowercase and a number',
  })
  newPassword: string;
}
