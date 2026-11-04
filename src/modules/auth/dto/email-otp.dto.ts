import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { EmailOtpPurpose } from '../email-otp-purpose.enum';

export class EmailOtpRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail() @MaxLength(254)
  email: string;

  @ApiProperty({ enum: EmailOtpPurpose })
  @IsEnum(EmailOtpPurpose)
  purpose: EmailOtpPurpose;

  @ApiPropertyOptional({ description: 'Target user ID when an SO requests an OTP for another SO or enterprise account. If omitted, BE resolves the target from the current email.' })
  @IsOptional() @IsUUID('4')
  targetUserId?: string;
}

export class VerifyEmailOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail() @MaxLength(254)
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString() @IsNotEmpty() @Matches(/^\d{6}$/)
  otpCode: string;
}
