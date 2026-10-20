import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChangeEmailDto, VerifyChangeEmailOtpDto } from './dto/change-email.dto';

@ApiTags('Authentication')
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
  @ApiOperation({ summary: 'Lấy thông tin tài khoản đang đăng nhập' })
  me(@Req() request: any) {
    return this.authService.me(request.user.id);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token bằng refresh token' })
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất và thu hồi phiên hiện tại' })
  logout(@Req() request: any) {
    return this.authService.logout(request.user.id, request.user.sessionId);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi mật khẩu và thu hồi tất cả phiên đăng nhập' })
  changePassword(@Req() request: any, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(request.user.id, body);
  }

  @Post('change-email/request-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gửi mã OTP đến email hiện tại trước khi thay đổi email' })
  requestEmailChange(@Req() request: any) {
    return this.authService.requestEmailChange(request.user.id);
  }

  @Post('change-email/verify-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xác minh mã OTP được gửi đến email hiện tại' })
  verifyChangeEmailOtp(@Req() request: any, @Body() body: VerifyChangeEmailOtpDto) {
    return this.authService.verifyEmailChange(request.user.id, body.otpCode);
  }

  @Patch('change-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật email sau khi xác minh OTP thành công' })
  changeEmail(@Req() request: any, @Body() body: ChangeEmailDto) {
    return this.authService.completeEmailChange(request.user.id, body.newEmail);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi mã OTP khôi phục mật khẩu đến email đã đăng ký' })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('resend-forgot-password-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi lại mã OTP khôi phục mật khẩu' })
  resendForgotPasswordOtp(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt mật khẩu mới bằng mã OTP trong email' })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }
}
