import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString({ message: 'Mật khẩu hiện tại phải là chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại.' })
  @MaxLength(128, { message: 'Mật khẩu hiện tại không được vượt quá 128 ký tự.' })
  currentPassword: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự.' })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' })
  @MaxLength(128, { message: 'Mật khẩu mới không được vượt quá 128 ký tự.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Mật khẩu mới phải có ít nhất một chữ hoa, một chữ thường và một chữ số.',
  })
  newPassword: string;
}
