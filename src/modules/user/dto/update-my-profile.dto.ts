import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Gender } from './update-user.dto';

export class UpdateMyProfileDto {
  @ApiProperty({ maxLength: 150 })
  @IsString() @MinLength(1) @MaxLength(150)
  fullname: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => value === '' ? null : value) @IsOptional() @IsDateString()
  birthDate?: string | null;

  @ApiPropertyOptional({ enum: Gender, nullable: true })
  @Transform(({ value }) => value === '' ? null : value) @IsOptional() @IsEnum(Gender)
  gender?: Gender | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => value === '' ? null : value) @IsOptional() @IsString() @MaxLength(150)
  position?: string | null;

  @ApiProperty({ format: 'uuid' }) @IsUUID('4') roleId: string;
  @ApiPropertyOptional({ nullable: true }) @Transform(({ value }) => value === '' ? null : value) @IsOptional() @IsString() province?: string | null;
  @ApiPropertyOptional({ nullable: true }) @Transform(({ value }) => value === '' ? null : value) @IsOptional() @IsString() ward?: string | null;
  @ApiPropertyOptional({ nullable: true }) @Transform(({ value }) => value === '' ? null : value) @IsOptional() @IsString() @MaxLength(500) address?: string | null;
  @ApiPropertyOptional({ default: false }) @IsOptional() removeAvatar?: boolean;
}
