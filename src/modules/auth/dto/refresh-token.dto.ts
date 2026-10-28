import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token được cấp sau khi đăng nhập thành công' })
  @IsJWT({ message: 'Mã làm mới không đúng định dạng.' })
  refreshToken: string;
}
