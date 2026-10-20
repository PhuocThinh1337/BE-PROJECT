import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsString({ message: 'Email phải là chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Vui lòng nhập email.' })
  @IsEmail({}, { message: 'Vui lòng nhập đúng định dạng email.' })
  email: string;
}
