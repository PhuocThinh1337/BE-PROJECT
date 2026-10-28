import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from './user.entity';
import { Role } from '../role/role.entity';
import { AuthSession } from '../auth/auth-session.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { storeAvatar, UploadedAvatar } from './avatar-upload';
import { PageResponseDto } from '../../commons/dto/page-response.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(AuthSession)
    private readonly sessionRepository: Repository<AuthSession>,
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
      .addSelect('user.resetPasswordAttempts')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  save(user: User) {
    return this.userRepository.save(user);
  }

  async listUsers(query: ListUsersQueryDto): Promise<PageResponseDto<UserResponseDto>> {
    const { page, size, fullname, username, email, roleName, position, isActive } = query;
    const builder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .orderBy('user.username', 'ASC')
      .skip((page - 1) * size)
      .take(size);
    if (fullname) builder.andWhere('user.fullname ILIKE :fullname', { fullname: `%${fullname}%` });
    if (username) builder.andWhere('user.username ILIKE :username', { username: `%${username}%` });
    if (email) builder.andWhere('user.email ILIKE :email', { email: `%${email}%` });
    if (roleName) builder.andWhere('(role.role ILIKE :roleName OR role.name ILIKE :roleName)', { roleName: `%${roleName}%` });
    if (position) builder.andWhere('user.position ILIKE :position', { position: `%${position}%` });
    if (isActive !== undefined) builder.andWhere('user.isActive = :isActive', { isActive });
    const [users, totalElements] = await builder.getManyAndCount();
    return {
      message: 'Lấy danh sách người dùng thành công',
      data: users.map((user) => ({
        userId: user.id,
        fullname: user.fullname || '',
        username: user.username,
        email: user.email || '',
        roleName: user.role.name,
        position: user.position || '',
        isActive: user.isActive,
      })),
      page, size, totalElements, totalPages: Math.ceil(totalElements / size),
    };
  }

  async deleteUsers(userIds: string[]) {
    const result = await this.userRepository.delete({ id: In(userIds) });
    return { message: 'Xóa người dùng thành công', data: { deletedCount: result.affected || 0 } };
  }

  async toggleUserStatus(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');
    user.isActive = !user.isActive;
    await this.userRepository.save(user);
    if (!user.isActive) {
      await this.sessionRepository.update({ userId: id, revokedAt: IsNull() }, { revokedAt: new Date() });
    }
    return { message: 'Cập nhật trạng thái người dùng thành công', data: { userId: user.id, isActive: user.isActive } };
  }

  async createUser(input: CreateUserDto, avatar?: UploadedAvatar) {
    const role = await this.roleRepository.findOne({ where: { id: input.roleId } });
    if (!role) throw new NotFoundException('Không tìm thấy vai trò.');

    const username = input.username.trim().toUpperCase();
    const validUsername = role.role === 'DOANH_NGHIEP'
      ? /^\d{10}$/.test(username)
      : role.role === 'SO' && /^VNA\d{8}$/.test(username);
    if (!validUsername) {
      throw new ConflictException('Tên tài khoản không đúng định dạng theo vai trò.');
    }
    const email = input.email.trim().toLowerCase();
    const existingUsername = await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) = LOWER(:username)', { username })
      .getOne();
    if (existingUsername) throw new ConflictException('Tên tài khoản đã tồn tại.');

    const existingEmail = await this.findByEmail(email);
    if (existingEmail) throw new ConflictException('Email đã được sử dụng.');

    const avatarUrl = avatar ? await storeAvatar(avatar) : null;
    const user = this.userRepository.create({
      username,
      fullname: input.fullname,
      password: input.password || '12345678',
      email,
      birthDate: input.birthDate ?? null,
      gender: input.gender ?? null,
      position: input.position ?? null,
      role,
      province: input.province ?? null,
      ward: input.ward ?? null,
      address: input.address ?? null,
      isActive: input.isActive,
      avatarUrl,
    });

    try {
      const saved = await this.userRepository.save(user);
      return {
        success: true,
        message: 'Tạo tài khoản người dùng thành công.',
        data: this.toUserDetail(saved),
      };
    } catch (error) {
      const databaseError = error as { code?: string };
      if (databaseError.code === '23505') {
        throw new ConflictException('Tên tài khoản hoặc email đã được sử dụng.');
      }
      throw error;
    }
  }

  async initializeUserPassword(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');
    user.password = await argon2.hash('12345678');
    await this.userRepository.save(user);
    await this.sessionRepository
      .createQueryBuilder()
      .update(AuthSession)
      .set({ revokedAt: new Date() })
      .where('"userId" = :targetUserId', { targetUserId: id })
      .andWhere('"revokedAt" IS NULL')
      .execute();
    return { success: true, message: 'Đã khởi tạo mật khẩu. Tài khoản cần đăng nhập lại.' };
  }

  async getUserDetail(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');
    return { success: true, data: this.toUserDetail(user) };
  }

  async updateUser(id: string, input: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');
    const role = await this.roleRepository.findOne({ where: { id: input.roleId } });
    if (!role) throw new NotFoundException('Role not found.');
    const usernameMatchesRole = role.role === 'DOANH_NGHIEP'
      ? /^\d{10}$/.test(user.username)
      : role.role === 'SO' && /^VNA\d{8}$/.test(user.username);
    if (!usernameMatchesRole) throw new ConflictException('The username format does not match the selected role.');

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

  async updateMyProfile(id: string, input: UpdateMeDto, avatarUrl?: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');

    // The contract includes roleId to match the admin update DTO. A user may
    // submit the current role, but cannot promote or demote their own account.
    if (input.roleId !== user.role.id) {
      throw new ConflictException('Không thể tự thay đổi vai trò của tài khoản.');
    }

    user.fullname = input.fullname;
    if (input.birthDate !== undefined) user.birthDate = input.birthDate;
    if (input.gender !== undefined) user.gender = input.gender;
    if (input.position !== undefined) user.position = input.position;
    if (input.province !== undefined) user.province = input.province;
    if (input.ward !== undefined) user.ward = input.ward;
    if (input.address !== undefined) user.address = input.address;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    const saved = await this.userRepository.save(user);
    const updated = await this.findById(saved.id);
    return { success: true, data: this.toUserDetail(updated) };
  }

  toUserDetail(user: User) {
    return {
      id: user.id,
      username: user.username,
      fullname: user.fullname || '',
      avatarUrl: user.avatarUrl || null,
      birthDate: user.birthDate || null,
      gender: user.gender || null,
      position: user.position || null,
      roleId: user.role.id,
      email: user.email || '',
      province: user.province || null,
      ward: user.ward || null,
      address: user.address || null,
      isActive: user.isActive,
    };
  }
}
