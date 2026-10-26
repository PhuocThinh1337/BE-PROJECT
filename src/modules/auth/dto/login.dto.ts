import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'VNA25789644' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @IsNotEmpty() @MaxLength(100)
  username: string;

  @ApiProperty()
  @IsString() @IsNotEmpty() @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  rememberMe?: boolean;
}
