import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from './update-user.dto';

export class UserDetailResponseDto {
  @ApiProperty() username: string;
  @ApiProperty() fullname: string;
  @ApiProperty({ nullable: true }) avatarUrl: string | null;
  @ApiProperty({ nullable: true }) birthDate: string | null;
  @ApiPropertyOptional({ enum: Gender, nullable: true }) gender: Gender | null;
  @ApiProperty({ nullable: true }) position: string | null;
  @ApiProperty({ description: 'Mã vai trò dưới dạng chuỗi theo hợp đồng API với FE' }) roleId: string;
  @ApiProperty() email: string;
  @ApiProperty({ nullable: true }) province: string | null;
  @ApiProperty({ nullable: true }) ward: string | null;
  @ApiProperty({ nullable: true }) address: string | null;
  @ApiProperty() isActive: boolean;
}
