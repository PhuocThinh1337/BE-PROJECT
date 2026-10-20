import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'SO' })
  role: string;

  @ApiProperty({ example: 'Quản trị viên Sở' })
  name: string;
}
