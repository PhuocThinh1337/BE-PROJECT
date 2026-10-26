import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListUsersQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() fullname?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() username?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() roleName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() position?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số trang phải là số nguyên.' })
  @Min(1, { message: 'Số trang phải từ 1 trở lên.' })
  page = 1;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Kích thước trang phải là số nguyên.' })
  @Min(1, { message: 'Kích thước trang phải từ 1 trở lên.' })
  @Max(100, { message: 'Kích thước trang không được vượt quá 100.' })
  size = 12;
}
