import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleService } from './role.service';
import { RoleResponseDto } from './dto/role-response.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách vai trò cho biểu mẫu cập nhật người dùng' })
  @ApiOkResponse({ description: 'Danh sách vai trò được trả về trong trường data', type: RoleResponseDto, isArray: true })
  list() {
    return this.roleService.list();
  }
}
