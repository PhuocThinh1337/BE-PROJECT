import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Put, Req, UploadedFile, UseGuards, ForbiddenException, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UserService } from './user.service';
import { storeAvatar, UploadedAvatar } from './avatar-upload';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('me')
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: {
    type: 'object',
    required: ['fullname'],
    properties: {
      fullname: { type: 'string' },
      birthDate: { type: 'string', format: 'date', nullable: true },
      gender: { type: 'string', enum: ['MALE', 'FEMALE'], nullable: true },
      position: { type: 'string', nullable: true },
      province: { type: 'string', nullable: true },
      ward: { type: 'string', nullable: true },
      address: { type: 'string', nullable: true },
      avatar: { type: 'string', format: 'binary' },
      removeAvatar: { type: 'boolean' },
    },
  } })
  @ApiOperation({ summary: 'Cập nhật hồ sơ của người dùng đang đăng nhập' })
  async updateMe(
    @Req() request: any,
    @Body() body: UpdateMyProfileDto,
    @UploadedFile() avatar: UploadedAvatar | undefined,
  ) {
    const avatarUrl = avatar ? await storeAvatar(avatar) : undefined;
    return this.userService.updateMyProfile(request.user.id, body, avatarUrl);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết người dùng để quản lý tài khoản (vai trò SO)' })
  getDetail(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: any) {
    this.assertSo(request.user.role);
    return this.userService.getUserDetail(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: {
    type: 'object',
    required: ['fullname', 'roleId', 'isActive'],
    properties: {
      fullname: { type: 'string' },
      birthDate: { type: 'string', format: 'date', nullable: true },
      gender: { type: 'string', enum: ['MALE', 'FEMALE'], nullable: true },
      position: { type: 'string', nullable: true },
      roleId: { type: 'string', example: '1' },
      province: { type: 'string', nullable: true },
      ward: { type: 'string', nullable: true },
      address: { type: 'string', nullable: true },
      isActive: { type: 'boolean' },
      avatar: { type: 'string', format: 'binary' },
    },
  } })
  @ApiOperation({ summary: 'Cập nhật hồ sơ và vai trò người dùng (vai trò SO)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateUserDto,
    @UploadedFile() avatar: UploadedAvatar | undefined,
    @Req() request: any,
  ) {
    this.assertSo(request.user.role);
    if (!avatar) return this.userService.updateUser(id, body);
    return storeAvatar(avatar).then((avatarUrl) =>
      this.userService.updateUser(id, { ...body, avatarUrl }),
    );
  }

  private assertSo(role: string) {
    if (role !== 'SO') throw new ForbiddenException('Chỉ người dùng thuộc Sở mới được quản lý tài khoản.');
  }
}
