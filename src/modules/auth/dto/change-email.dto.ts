import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class ChangeEmailDto {
  @ApiProperty({ example: 'new-address@example.com' })
  @IsEmail({}, { message: 'Vui lòng nhập đúng định dạng email.' })
  newEmail: string;
}

export class VerifyChangeEmailOtpDto {
  @ApiProperty({ example: '123456' })
  @IsString({ message: 'Mã OTP phải là chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Vui lòng nhập mã OTP.' })
  @Matches(/^\d{6}$/, { message: 'Mã OTP phải gồm đúng 6 chữ số.' })
  otpCode: string;
}
