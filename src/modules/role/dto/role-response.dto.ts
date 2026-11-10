import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ format: 'uuid' })
  roleId: string;

  @ApiProperty({ enum: ['DOANH_NGHIEP', 'SO'], example: 'SO' })
  code: 'DOANH_NGHIEP' | 'SO';

  @ApiProperty({ example: 'Quản trị viên Sở' })
  name: string;
}
