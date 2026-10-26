import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export enum Gender { MALE = 'MALE', FEMALE = 'FEMALE' }
const emptyToNull = ({ value }: { value: unknown }) => value === '' ? null : value;

export class UpdateUserDto {
  @ApiProperty({ maxLength: 150 }) @IsString() @MinLength(1) @MaxLength(150)
  fullname: string;
  @ApiPropertyOptional({ nullable: true }) @Transform(emptyToNull) @IsOptional() @IsDateString()
  birthDate?: string | null;
  @ApiPropertyOptional({ enum: Gender, nullable: true }) @Transform(emptyToNull) @IsOptional() @IsEnum(Gender)
  gender?: Gender | null;
  @ApiPropertyOptional({ nullable: true }) @Transform(emptyToNull) @IsOptional() @IsString() @MaxLength(150)
  position?: string | null;
  @ApiProperty({ format: 'uuid' }) @IsUUID('4')
  roleId: string;
  @ApiPropertyOptional({ nullable: true }) @Transform(emptyToNull) @IsOptional() @IsString() @MaxLength(150)
  province?: string | null;
  @ApiPropertyOptional({ nullable: true }) @Transform(emptyToNull) @IsOptional() @IsString() @MaxLength(150)
  ward?: string | null;
  @ApiPropertyOptional({ nullable: true }) @Transform(emptyToNull) @IsOptional() @IsString() @MaxLength(500)
  address?: string | null;
  @ApiProperty() @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value) @IsBoolean()
  isActive: boolean;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(2048)
  avatarUrl?: string | null;
}
