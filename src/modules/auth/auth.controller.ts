import { Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChangeEmailDto, VerifyChangeEmailOtpDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailOtpRequestDto, VerifyEmailOtpDto } from './dto/email-otp.dto';
import { InitializePasswordDto } from './dto/initialize-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthService } from './auth.service';
import { EmailOtpPurpose } from './email-otp-purpose.enum';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LocalAuthGuard } from './local-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

@ApiTags('Xác thực')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Đăng nhập bằng tên đăng nhập và mật khẩu' })
  login(@Req() request: any, @Body() body: LoginDto) {
    return this.authService.login(request.user, body.rememberMe);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@Req() request: any) { return this.authService.me(request.user.id); }

  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto) { return this.authService.refresh(body.refreshToken); }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  logout(@Req() request: any) { return this.authService.logout(request.user.id, request.user.sessionId); }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  changePassword(@Req() request: any, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(request.user.id, body);
  }

  @Post('initialize-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khởi tạo mật khẩu cho tài khoản hiện tại' })
  initializePassword(@Req() request: any, @Body() body: InitializePasswordDto) {
    return this.authService.initializePassword(request.user.id, body.password);
  }

  @Post(':userId/initialize-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sở khởi tạo mật khẩu cho tài khoản người dùng hoặc doanh nghiệp' })
  initializePasswordForUser(@Param('userId', new ParseUUIDPipe()) userId: string, @Req() request: any, @Body() body: InitializePasswordDto) {
    if (request.user.role !== 'SO') throw new ForbiddenException('Chỉ tài khoản Sở mới được khởi tạo mật khẩu cho tài khoản khác.');
    return this.authService.initializePassword(userId, body.password);
  }

  @Post('email-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Gửi OTP; CHANGE_EMAIL yêu cầu Bearer token. SO có thể truyền targetUserId để đổi email cho SO khác.' })
  sendEmailOtp(@Req() request: any, @Body() body: EmailOtpRequestDto) {
    return this.authService.sendEmailOtp(body.email, body.purpose as EmailOtpPurpose, request.user?.id, request.user?.role, body.targetUserId);
  }

  @Post('change-email/verify-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  verifyChangeEmailOtp(@Req() request: any, @Body() body: VerifyChangeEmailOtpDto) {
    return this.authService.verifyChangeEmailOtp(request.user.id, body.email, body.otpCode, request.user.role, body.targetUserId);
  }

  @Patch('change-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  changeEmail(@Req() request: any, @Body() body: ChangeEmailDto) {
    return this.authService.completeEmailChange(request.user.id, body.newEmail);
  }

  @Patch('change-email/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SO đổi email doanh nghiệp không cần OTP hoặc tài khoản SO sau khi xác minh OTP' })
  changeAccountEmail(@Param('userId', new ParseUUIDPipe()) userId: string, @Req() request: any, @Body() body: ChangeEmailDto) {
    return this.authService.changeManagedAccountEmail(request.user.role, userId, body.newEmail);
  }

  @Post('register-enterprise/verify-email-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác minh email đăng ký doanh nghiệp bằng OTP' })
  verifyEnterpriseRegistrationEmail(@Body() body: VerifyEmailOtpDto) {
    return this.authService.verifyEnterpriseRegistrationEmail(body.email, body.otpCode);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) { return this.authService.resetPassword(body); }
}
