import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
export class ChangeEmailDto {
  @ApiProperty({ example: 'new-address@example.com' }) @IsEmail()
  newEmail: string;
}
export class VerifyChangeEmailOtpDto {
  @ApiProperty({ example: 'new-address@example.com' })
  @IsEmail() @MaxLength(254)
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString() @IsNotEmpty() @Matches(/^\d{6}$/)
  otpCode: string;
}
