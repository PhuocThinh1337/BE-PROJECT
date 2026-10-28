import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUsersDto } from './dto/delete-users.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { storeAvatar, UploadedAvatar } from './avatar-upload';

@ApiTags('Người dùng')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách người dùng có lọc và phân trang' })
  @ApiQuery({ name: 'fullname', required: false })
  @ApiQuery({ name: 'username', required: false })
  @ApiQuery({ name: 'email', required: false })
  @ApiQuery({ name: 'roleName', required: false })
  @ApiQuery({ name: 'position', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'size', required: false, type: Number, example: 12 })
  list(@Query() query: ListUsersQueryDto, @Req() request: any) {
    this.assertSo(request.user.role);
    return this.userService.listUsers(query);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa một hoặc nhiều người dùng' })
  deleteMany(@Body() body: DeleteUsersDto, @Req() request: any) {
    this.assertSo(request.user.role);
    return this.userService.deleteUsers(body.userIds);
  }

  @Post()
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['username', 'fullname', 'roleId', 'email', 'isActive'], properties: {
    username: { type: 'string', example: 'VNA25789644' },
    fullname: { type: 'string' },
    password: { type: 'string', minLength: 8, default: '12345678' },
    birthDate: { type: 'string', format: 'date', nullable: true },
    gender: { type: 'string', enum: ['MALE', 'FEMALE'], nullable: true },
    position: { type: 'string', nullable: true },
    roleId: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    province: { type: 'string', nullable: true },
    ward: { type: 'string', nullable: true },
    address: { type: 'string', nullable: true },
    isActive: { type: 'boolean' },
    avatar: { type: 'string', format: 'binary' },
  } } })
  @ApiOperation({ summary: 'Tạo người dùng' })
  async create(@Body() body: CreateUserDto, @UploadedFile() avatar: UploadedAvatar | undefined, @Req() request: any) {
    this.assertSo(request.user.role);
    return this.userService.createUser(body, avatar);
  }

  @Put('me')
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['fullname', 'roleId'], properties: {
    fullname: { type: 'string' },
    birthDate: { type: 'string', format: 'date', nullable: true },
    gender: { type: 'string', enum: ['MALE', 'FEMALE'], nullable: true },
    position: { type: 'string', nullable: true },
    roleId: { type: 'string', format: 'uuid' },
    province: { type: 'string', nullable: true },
    ward: { type: 'string', nullable: true },
    address: { type: 'string', nullable: true },
    avatar: { type: 'string', format: 'binary' },
  } } })
  @ApiOperation({ summary: 'Cập nhật thông tin tài khoản hiện tại' })
  async updateMe(@Req() request: any, @Body() body: UpdateMeDto, @UploadedFile() avatar: UploadedAvatar | undefined) {
    const avatarUrl = avatar ? await storeAvatar(avatar) : undefined;
    return this.userService.updateMyProfile(request.user.id, body, avatarUrl);
  }

  @Post(':id/initialize-password')
  @ApiOperation({ summary: 'Khởi tạo lại mật khẩu và thu hồi các phiên đăng nhập của người dùng' })
  initializePassword(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: any) {
    this.assertSo(request.user.role);
    return this.userService.initializeUserPassword(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Đổi trạng thái hoạt động của người dùng' })
  toggleStatus(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: any) {
    this.assertSo(request.user.role);
    return this.userService.toggleUserStatus(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết người dùng' })
  getDetail(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: any) {
    this.assertSo(request.user.role);
    return this.userService.getUserDetail(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['fullname', 'roleId', 'isActive'], properties: {
    fullname: { type: 'string' },
    birthDate: { type: 'string', format: 'date', nullable: true },
    gender: { type: 'string', enum: ['MALE', 'FEMALE'], nullable: true },
    position: { type: 'string', nullable: true },
    roleId: { type: 'string', format: 'uuid' },
    province: { type: 'string', nullable: true },
    ward: { type: 'string', nullable: true },
    address: { type: 'string', nullable: true },
    isActive: { type: 'boolean' },
    avatar: { type: 'string', format: 'binary' },
  } } })
  @ApiOperation({ summary: 'Cập nhật thông tin và vai trò người dùng' })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateUserDto, @UploadedFile() avatar: UploadedAvatar | undefined, @Req() request: any) {
    this.assertSo(request.user.role);
    if (!avatar) return this.userService.updateUser(id, body);
    return storeAvatar(avatar).then((avatarUrl) => this.userService.updateUser(id, { ...body, avatarUrl }));
  }

  private assertSo(role: string) {
    if (role !== 'SO') throw new ForbiddenException('Chỉ tài khoản Sở mới được quản lý người dùng.');
  }
}
