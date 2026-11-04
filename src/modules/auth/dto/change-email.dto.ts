import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class ChangeEmailDto {
  @ApiProperty({ example: 'new-address@example.com' })
  @IsEmail() @MaxLength(254)
  newEmail: string;
}

export class VerifyChangeEmailOtpDto {
  @ApiProperty({ example: 'new-address@example.com' })
  @IsEmail() @MaxLength(254)
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString() @IsNotEmpty() @Matches(/^\d{6}$/)
  otpCode: string;

  @ApiPropertyOptional({ description: 'Target user ID when an SO verifies an OTP for another SO or enterprise account. If omitted, BE resolves the target from the current email.' })
  @IsOptional() @IsUUID('4')
  targetUserId?: string;
}
