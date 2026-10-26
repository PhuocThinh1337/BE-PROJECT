import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListEnterprisesQueryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() taxCode?: string;
  @IsOptional() @IsString() businessType?: string;
  @IsOptional() @IsString() businessIndustry?: string;
  @IsOptional() @IsString() ward?: string;
  @IsOptional() @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value) @IsBoolean() isActive?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) size = 12;
}
