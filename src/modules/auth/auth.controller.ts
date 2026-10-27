import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChangeEmailDto, VerifyChangeEmailOtpDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { InitializePasswordDto } from './dto/initialize-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LocalAuthGuard } from './local-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login with username and password' })
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
  @ApiOperation({ summary: 'Initialize password for the current user or enterprise account' })
  initializePassword(@Req() request: any, @Body() body: InitializePasswordDto) {
    return this.authService.initializePassword(request.user.id, body.password);
  }

  @Post('change-email/request-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  requestEmailChange(@Req() request: any) {
    return this.authService.requestEmailChange(request.user.id);
  }

  @Post('change-email/verify-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  verifyChangeEmailOtp(@Req() request: any, @Body() body: VerifyChangeEmailOtpDto) {
    return this.authService.verifyEmailChange(request.user.id, body.otpCode);
  }

  @Patch('change-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  changeEmail(@Req() request: any, @Body() body: ChangeEmailDto) {
    return this.authService.completeEmailChange(request.user.id, body.newEmail);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) { return this.authService.forgotPassword(body.email); }

  @Post('resend-forgot-password-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend password recovery OTP' })
  resendForgotPasswordOtp(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) { return this.authService.resetPassword(body); }
}
