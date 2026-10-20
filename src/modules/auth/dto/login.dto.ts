import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({ example: 'so_admin' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString({ message: 'Tên đăng nhập phải là chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Vui lòng nhập tên đăng nhập.' })
  @MaxLength(100, { message: 'Tên đăng nhập không được vượt quá 100 ký tự.' })
  username: string;

  @ApiProperty({ example: 'Test@123456' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu.' })
  @MaxLength(128, { message: 'Mật khẩu không được vượt quá 128 ký tự.' })
  password: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: 'Ghi nhớ đăng nhập phải có giá trị true hoặc false.' })
  rememberMe?: boolean;
}
