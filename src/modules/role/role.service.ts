import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RoleService {
  constructor(@InjectRepository(Role) private readonly roleRepository: Repository<Role>) {}

  async list() {
    const roles = await this.roleRepository.find({ order: { id: 'ASC' } });
    return {
      success: true,
      message: 'Lấy danh sách vai trò thành công.',
      data: roles.map(({ id, role, name }) => ({ roleId: id, code: role, name })),
    };
  }
}
