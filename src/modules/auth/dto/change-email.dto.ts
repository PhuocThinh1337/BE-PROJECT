import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
export class ChangeEmailDto {
  @ApiProperty({ example: 'new-address@example.com' }) @IsEmail()
  newEmail: string;
}
export class VerifyChangeEmailOtpDto {
  @ApiProperty({ example: '123456' })
  @IsString() @IsNotEmpty() @Matches(/^\d{6}$/)
  otpCode: string;
}
