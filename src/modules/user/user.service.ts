import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from '../role/role.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  findByUsername(username: string) {
    return this.userRepository.findOne({ where: { username }, relations: ['role'] });
  }

  findByEmail(email: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  findById(id: string) {
    return this.userRepository.findOne({ where: { id }, relations: ['role'] });
  }

  findByIdForPassword(id: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :id', { id })
      .getOne();
  }

  findByEmailForReset(email: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.resetPasswordTokenHash')
      .addSelect('user.resetPasswordExpiresAt')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  save(user: User) {
    return this.userRepository.save(user);
  }

  async getUserDetail(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');
    return { success: true, data: this.toUserDetail(user) };
  }

  async updateUser(id: string, input: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');
    const role = await this.roleRepository.findOne({ where: { id: Number(input.roleId) } });
    if (!role) throw new NotFoundException('Không tìm thấy vai trò.');

    user.fullname = input.fullname;
    if (input.birthDate !== undefined) user.birthDate = input.birthDate;
    if (input.gender !== undefined) user.gender = input.gender;
    if (input.position !== undefined) user.position = input.position;
    if (input.province !== undefined) user.province = input.province;
    if (input.ward !== undefined) user.ward = input.ward;
    if (input.address !== undefined) user.address = input.address;
    user.isActive = input.isActive;
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl;
    user.role = role;

    try {
      const saved = await this.userRepository.save(user);
      const updated = await this.findById(saved.id);
      return { success: true, data: this.toUserDetail(updated) };
    } catch (error) {
      if ((error as any)?.code === '23505') throw new ConflictException('Thông tin người dùng bị trùng với dữ liệu đã tồn tại.');
      throw error;
    }
  }

  async updateMyProfile(id: string, input: UpdateMyProfileDto, avatarUrl?: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');

    user.fullname = input.fullname;
    if (input.birthDate !== undefined) user.birthDate = input.birthDate;
    if (input.gender !== undefined) user.gender = input.gender;
    if (input.position !== undefined) user.position = input.position;
    if (input.province !== undefined) user.province = input.province;
    if (input.ward !== undefined) user.ward = input.ward;
    if (input.address !== undefined) user.address = input.address;
    if (input.removeAvatar) user.avatarUrl = null;
    if (avatarUrl) user.avatarUrl = avatarUrl;

    const saved = await this.userRepository.save(user);
    const updated = await this.findById(saved.id);
    return { success: true, data: this.toUserDetail(updated) };
  }

  toUserDetail(user: User) {
    return {
      username: user.username,
      fullname: user.fullname || '',
      avatarUrl: user.avatarUrl || null,
      birthDate: user.birthDate || null,
      gender: user.gender || null,
      position: user.position || null,
      roleId: String(user.role.id),
      email: user.email || '',
      province: user.province || null,
      ward: user.ward || null,
      address: user.address || null,
      isActive: user.isActive,
    };
  }
}
