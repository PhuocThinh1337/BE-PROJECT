import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export class UpdateUserDto {
  @ApiProperty({ maxLength: 150 })
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự.' })
  @MinLength(1, { message: 'Vui lòng nhập họ và tên.' })
  @MaxLength(150, { message: 'Họ và tên không được vượt quá 150 ký tự.' })
  fullname: string;

  @ApiPropertyOptional({ nullable: true, example: '1995-01-06' })
  @Transform(({ value }) => value === '' ? null : value)
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không đúng định dạng. Vui lòng dùng YYYY-MM-DD.' })
  birthDate?: string | null;

  @ApiPropertyOptional({ enum: Gender, nullable: true })
  @Transform(({ value }) => value === '' ? null : value)
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính chỉ nhận MALE hoặc FEMALE.' })
  gender?: Gender | null;

  @ApiPropertyOptional({ maxLength: 150, nullable: true })
  @Transform(({ value }) => value === '' ? null : value)
  @IsOptional()
  @IsString({ message: 'Chức danh phải là chuỗi ký tự.' })
  @MaxLength(150, { message: 'Chức danh không được vượt quá 150 ký tự.' })
  position?: string | null;

  @ApiProperty({ description: 'Mã vai trò được gửi dưới dạng chuỗi' })
  @IsString({ message: 'Mã vai trò phải là chuỗi ký tự.' })
  @Matches(/^[1-9]\d*$/, { message: 'Mã vai trò phải là số nguyên dương.' })
  @MaxLength(10, { message: 'Mã vai trò không hợp lệ.' })
  roleId: string;

  @ApiPropertyOptional({ maxLength: 150, nullable: true })
  @Transform(({ value }) => value === '' ? null : value)
  @IsOptional()
  @IsString({ message: 'Tỉnh/thành phố phải là chuỗi ký tự.' })
  @MaxLength(150, { message: 'Tỉnh/thành phố không được vượt quá 150 ký tự.' })
  province?: string | null;

  @ApiPropertyOptional({ maxLength: 150, nullable: true })
  @Transform(({ value }) => value === '' ? null : value)
  @IsOptional()
  @IsString({ message: 'Phường/xã phải là chuỗi ký tự.' })
  @MaxLength(150, { message: 'Phường/xã không được vượt quá 150 ký tự.' })
  ward?: string | null;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @Transform(({ value }) => value === '' ? null : value)
  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự.' })
  @MaxLength(500, { message: 'Địa chỉ không được vượt quá 500 ký tự.' })
  address?: string | null;

  @ApiProperty({ description: 'Trạng thái hoạt động của tài khoản' })
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  @IsBoolean({ message: 'Trạng thái hoạt động phải có giá trị true hoặc false.' })
  isActive: boolean;

  @ApiPropertyOptional({ nullable: true, description: 'Đường dẫn ảnh đại diện đã tải lên' })
  @IsOptional()
  @IsString({ message: 'Đường dẫn ảnh đại diện phải là chuỗi ký tự.' })
  @MaxLength(2048, { message: 'Đường dẫn ảnh đại diện quá dài.' })
  avatarUrl?: string | null;
}
