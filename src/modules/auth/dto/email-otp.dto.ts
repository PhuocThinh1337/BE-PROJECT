import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { EmailOtpPurpose } from '../email-otp-purpose.enum';

export class EmailOtpRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail() @MaxLength(254)
  email: string;

  @ApiProperty({ enum: EmailOtpPurpose })
  @IsEnum(EmailOtpPurpose)
  purpose: EmailOtpPurpose;
}

export class VerifyEmailOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail() @MaxLength(254)
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString() @IsNotEmpty() @Matches(/^\d{6}$/)
  otpCode: string;
}
