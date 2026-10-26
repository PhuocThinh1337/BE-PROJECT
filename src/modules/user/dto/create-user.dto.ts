import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import { Gender } from './update-user.dto';

const emptyToNull = ({ value }: { value: unknown }) => value === '' ? null : value;

export class CreateUserDto {
  @ApiProperty({ example: 'VNA25789644' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @IsString() @IsNotEmpty() @Matches(/^(?:VNA\d{8}|\d{10})$/) @MaxLength(11)
  username: string;

  @ApiProperty({ maxLength: 150 })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @MinLength(1) @MaxLength(150)
  fullname: string;

  @ApiPropertyOptional({ minLength: 8, default: '12345678' })
  @Transform(({ value }) => value === undefined || value === '' ? '12345678' : value)
  @IsString() @MinLength(8)
  password = '12345678';

  @ApiPropertyOptional({ nullable: true }) @Transform(emptyToNull) @IsOptional() @IsDateString()
  birthDate?: string | null;
  @ApiPropertyOptional({ enum: Gender, nullable: true }) @Transform(emptyToNull) @IsOptional() @IsEnum(Gender)
  gender?: Gender | null;
  @ApiPropertyOptional({ nullable: true }) @Transform(emptyToNull) @IsOptional() @IsString() @MaxLength(150)
  position?: string | null;
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') roleId: string;
  @ApiProperty({ example: 'user@example.com' }) @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value) @IsEmail() @MaxLength(254)
  email: string;
  @ApiPropertyOptional({ nullable: true }) @Transform(emptyToNull) @IsOptional() @IsString() @MaxLength(150)
  province?: string | null;
  @ApiPropertyOptional({ nullable: true }) @Transform(emptyToNull) @IsOptional() @IsString() @MaxLength(150)
  ward?: string | null;
  @ApiPropertyOptional({ nullable: true }) @Transform(emptyToNull) @IsOptional() @IsString() @MaxLength(500)
  address?: string | null;
  @ApiProperty({ default: true }) @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value) @IsBoolean()
  isActive: boolean;
  @ApiPropertyOptional({ nullable: true, type: 'string', format: 'binary' }) @IsOptional()
  avatar?: null;
}
