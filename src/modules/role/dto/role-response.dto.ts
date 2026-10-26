import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'SO' })
  role: string;

  @ApiProperty({ example: 'Quản trị viên Sở' })
  name: string;
}
