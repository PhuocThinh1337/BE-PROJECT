import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Gender } from './update-user.dto';

export class UpdateMyProfileDto {
  @ApiProperty({ maxLength: 150 })
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự.' })
  @MinLength(1, { message: 'Vui lòng nhập họ và tên.' })
  @MaxLength(150, { message: 'Họ và tên không được vượt quá 150 ký tự.' })
  fullname: string;

  @ApiPropertyOptional({ example: '1995-01-06', nullable: true })
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

  @ApiPropertyOptional({ description: 'Đặt true để xóa ảnh đại diện hiện tại' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  @IsBoolean({ message: 'Trường xóa ảnh đại diện phải có giá trị true hoặc false.' })
  removeAvatar?: boolean;
}
