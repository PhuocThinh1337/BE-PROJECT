import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail() email: string;

  @ApiProperty({ example: '123456' })
  @IsString() @IsNotEmpty() @Matches(/^\d{6}$/)
  otpCode: string;

  @ApiProperty({ minLength: 8 })
  @IsString() @MinLength(8) @MaxLength(128)
  newPassword: string;

  @ApiProperty({ minLength: 8 })
  @IsString() @MinLength(8) @MaxLength(128)
  confirmNewPassword: string;
}
