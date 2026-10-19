import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token được cấp khi đăng nhập' })
  @IsJWT()
  refreshToken: string;
}
