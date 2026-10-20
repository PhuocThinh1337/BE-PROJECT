import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail({}, { message: 'Vui lòng nhập đúng định dạng email.' })
  email: string;

  @ApiProperty({ description: 'Mã OTP gồm 6 chữ số được gửi đến email', example: '123456' })
  @IsString({ message: 'Mã OTP phải là chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Vui lòng nhập mã OTP.' })
  @Matches(/^\d{6}$/, { message: 'Mã OTP phải gồm đúng 6 chữ số.' })
  otpCode: string;

  @ApiProperty({ minLength: 8, maxLength: 128, example: 'NewTest@123456' })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự.' })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' })
  @MaxLength(128, { message: 'Mật khẩu mới không được vượt quá 128 ký tự.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Mật khẩu mới phải có ít nhất một chữ hoa, một chữ thường và một chữ số.',
  })
  newPassword: string;

  @ApiProperty({ minLength: 8, maxLength: 128, example: 'NewTest@123456' })
  @IsString({ message: 'Mật khẩu xác nhận phải là chuỗi ký tự.' })
  @MinLength(8, { message: 'Mật khẩu xác nhận phải có ít nhất 8 ký tự.' })
  @MaxLength(128, { message: 'Mật khẩu xác nhận không được vượt quá 128 ký tự.' })
  confirmNewPassword: string;
}
