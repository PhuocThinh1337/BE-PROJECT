import { BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, createHmac, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import * as argon2 from 'argon2';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { MailService } from './mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthSession } from './auth-session.entity';
import { EmailChangeRequest } from './email-change-request.entity';
import { PASSWORD_RESET_OTP_MAX_ATTEMPTS, PASSWORD_RESET_OTP_TTL_MINUTES } from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    @InjectRepository(AuthSession)
    private readonly sessionRepository: Repository<AuthSession>,
    @InjectRepository(EmailChangeRequest)
    private readonly emailChangeRepository: Repository<EmailChangeRequest>,
  ) {}

  async login(user: User, rememberMe = false) {
    const sessionId = randomUUID();
    const refreshExpiresIn = rememberMe ? '30d' : '1d';
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, sid: sessionId, type: 'refresh' },
      { secret: this.config.get<string>('jwt.refreshSecret'), expiresIn: refreshExpiresIn, issuer: 'ncc-backend' },
    );
    const refreshTtl = rememberMe ? 30 : 1;
    const session = this.sessionRepository.create({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: this.hashResetToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshTtl * 24 * 60 * 60 * 1000),
    });
    await this.sessionRepository.save(session);
    const accessToken = await this.createAccessToken(user, sessionId);
    return {
      success: true,
      message: '\u0110\u0103ng nh\u1eadp th\u00e0nh c\u00f4ng',
      data: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 900,
        user: { id: user.id, username: user.username, role: user.role.role },
      },
    };
  }

  async me(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
    return { success: true, data: this.userService.toUserDetail(user) };
  }

  async requestEmailChange(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
    if (!user.email) throw new BadRequestException('Tài khoản chưa có địa chỉ email.');

    const previousRequest = await this.emailChangeRepository.findOne({ where: { userId } });
    if (previousRequest && Date.now() - previousRequest.createdAt.getTime() < 60_000) {
      throw new HttpException('Vui lòng chờ một phút trước khi yêu cầu gửi lại mã OTP.', HttpStatus.TOO_MANY_REQUESTS);
    }
    await this.emailChangeRepository.delete({ userId });
    const otp = randomInt(100000, 1000000).toString();
    const request = this.emailChangeRepository.create({
      id: randomUUID(),
      userId,
      newEmail: user.email.toLowerCase(),
      otpHash: this.hashResetToken(otp),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      verifiedAt: null,
    });
    await this.emailChangeRepository.save(request);
    try {
      await this.mailService.sendEmailChangeOtp(user.email, otp);
    } catch (error) {
      await this.emailChangeRepository.delete({ id: request.id });
      throw error;
    }
    return { success: true, message: 'Mã OTP đã được gửi đến email hiện tại.' };
  }

  async verifyEmailChange(userId: string, otp: string) {
    const request = await this.emailChangeRepository.findOne({ where: { userId } });
    if (!request || request.expiresAt.getTime() <= Date.now()) {
      if (request) await this.emailChangeRepository.delete({ id: request.id });
      throw new BadRequestException('Mã OTP xác minh email không hợp lệ hoặc đã hết hạn.');
    }
    if (request.attempts >= 5) {
      await this.emailChangeRepository.delete({ id: request.id });
      throw new BadRequestException('Bạn đã nhập sai quá số lần cho phép. Vui lòng yêu cầu mã OTP mới.');
    }
    if (!this.hashMatches(otp, request.otpHash)) {
      request.attempts += 1;
      await this.emailChangeRepository.save(request);
      throw new BadRequestException('Mã OTP xác minh email không hợp lệ hoặc đã hết hạn.');
    }
    request.verifiedAt = new Date();
    request.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await this.emailChangeRepository.save(request);
    return { success: true, message: 'Xác minh email thành công. Vui lòng nhập email mới trong vòng 5 phút.' };
  }

  async completeEmailChange(userId: string, newEmail: string) {
    const normalizedEmail = newEmail.trim().toLowerCase();
    const request = await this.emailChangeRepository.findOne({ where: { userId } });
    if (!request || !request.verifiedAt || request.expiresAt.getTime() <= Date.now()) {
      if (request) await this.emailChangeRepository.delete({ id: request.id });
      throw new BadRequestException('Hãy xác minh mã OTP trước khi đổi email hoặc yêu cầu mã mới.');
    }
    if (request.newEmail === normalizedEmail) {
      throw new BadRequestException('Email mới phải khác email hiện tại.');
    }
    const existingUser = await this.userService.findByEmail(normalizedEmail);
    if (existingUser && existingUser.id !== userId) throw new ConflictException('Email này đã được sử dụng.');
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
    if (user.email?.toLowerCase() !== request.newEmail) {
      await this.emailChangeRepository.delete({ id: request.id });
      throw new BadRequestException('Email tài khoản đã thay đổi. Vui lòng yêu cầu mã OTP mới.');
    }
    user.email = normalizedEmail;
    await this.userService.save(user);
    await this.emailChangeRepository.delete({ id: request.id });
    return { success: true, message: 'Cập nhật email thành công.' };
  }

  async refresh(refreshToken: string) {
    let claims: any;
    try {
      claims = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'), issuer: 'ncc-backend',
      });
    } catch (_error) {
      throw new UnauthorizedException('Mã làm mới phiên không hợp lệ hoặc đã hết hạn.');
    }
    if (claims.type !== 'refresh' || !claims.sid || !claims.sub) {
      throw new UnauthorizedException('Mã làm mới phiên không hợp lệ.');
    }

    const session = await this.sessionRepository.findOne({ where: { id: claims.sid, userId: claims.sub } });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now() ||
      !this.hashMatches(refreshToken, session.refreshTokenHash)) {
      throw new UnauthorizedException('Mã làm mới phiên không hợp lệ hoặc phiên đăng nhập đã bị thu hồi.');
    }

    const user = await this.userService.findById(claims.sub);
    if (!user) throw new UnauthorizedException('Tài khoản không tồn tại.');
    if (user.status) throw new ForbiddenException('Tài khoản đã bị khóa.');
    if (user.isActive === false) throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa.');

    const nextRefreshToken = await this.jwtService.signAsync(
      { sub: user.id, sid: session.id, type: 'refresh' },
      { secret: this.config.get<string>('jwt.refreshSecret'), expiresIn: Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)), issuer: 'ncc-backend' },
    );
    session.refreshTokenHash = this.hashResetToken(nextRefreshToken);
    await this.sessionRepository.save(session);
    return {
      success: true,
      data: { accessToken: await this.createAccessToken(user, session.id), refreshToken: nextRefreshToken, tokenType: 'Bearer', expiresIn: 900 },
    };
  }

  async logout(userId: string, sessionId: string) {
    await this.sessionRepository.update({ id: sessionId, userId, revokedAt: IsNull() }, { revokedAt: new Date() });
    return { success: true, message: 'Đăng xuất thành công.' };
  }

  async changePassword(userId: string, input: ChangePasswordDto) {
    if (input.newPassword !== input.confirmNewPassword) {
      throw new BadRequestException('Mật khẩu mới và mật khẩu xác nhận không khớp.');
    }
    const user = await this.userService.findByIdForPassword(userId);
    if (!user || !(await argon2.verify(user.password, input.currentPassword))) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác.');
    }
    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại.');
    }
    user.password = await argon2.hash(input.newPassword);
    await this.userService.save(user);
    await this.sessionRepository.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
    return { success: true, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  async initializePassword(userId: string, password: string) {
    const user = await this.userService.findByIdForPassword(userId);
    if (!user) throw new UnauthorizedException('Tài khoản không tồn tại.');
    user.password = await argon2.hash(password);
    await this.userService.save(user);
    await this.sessionRepository.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
    return { success: true, message: 'Khởi tạo mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userService.findByEmail(normalizedEmail);
    if (!user) throw new NotFoundException('Email chưa đăng ký trên hệ thống. Vui lòng thử lại.');

    const otp = randomInt(100000, 1000000).toString();
    user.resetPasswordTokenHash = this.hashResetOtp(otp);
    user.resetPasswordExpiresAt = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MINUTES * 60 * 1000);
    user.resetPasswordAttempts = 0;
    await this.userService.save(user);

    try {
      await this.mailService.sendPasswordResetOtp(normalizedEmail, otp, user.username, user.fullname);
    } catch (error) {
      user.resetPasswordTokenHash = null;
      user.resetPasswordExpiresAt = null;
      user.resetPasswordAttempts = 0;
      await this.userService.save(user);
      throw error;
    }

    return { success: true, message: 'Gửi email thành công.' };
  }

  async resetPassword(input: ResetPasswordDto) {
    const user = await this.userService.findByEmailForReset(input.email);
    const storedHash = user?.resetPasswordTokenHash;

    if (
      !user ||
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Mã OTP khôi phục mật khẩu không hợp lệ hoặc đã hết hạn.');
    }

    if (user.resetPasswordAttempts >= PASSWORD_RESET_OTP_MAX_ATTEMPTS || !storedHash) {
      throw new BadRequestException('Mã OTP khôi phục mật khẩu không hợp lệ hoặc đã hết hạn.');
    }

    if (input.newPassword !== input.confirmNewPassword) {
      throw new BadRequestException('Mật khẩu mới và mật khẩu xác nhận không khớp.');
    }

    if (!this.hashMatchesOtp(input.otpCode, storedHash)) {
      user.resetPasswordAttempts += 1;
      if (user.resetPasswordAttempts >= PASSWORD_RESET_OTP_MAX_ATTEMPTS) {
        user.resetPasswordTokenHash = null;
        user.resetPasswordExpiresAt = null;
      }
      await this.userService.save(user);
      throw new BadRequestException('Mã OTP khôi phục mật khẩu không hợp lệ hoặc đã hết hạn.');
    }

    user.password = await argon2.hash(input.newPassword);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    user.resetPasswordAttempts = 0;
    await this.userService.save(user);
    await this.sessionRepository.update({ userId: user.id, revokedAt: IsNull() }, { revokedAt: new Date() });

    return { success: true, message: 'Khôi phục mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  private hashResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private hashResetOtp(otp: string) {
    const secret = this.config.get<string>('jwt.secret');
    if (!secret) throw new ServiceUnavailableException('Chưa cấu hình khóa bí mật JWT.');
    return createHmac('sha256', secret)
      .update(otp)
      .digest('hex');
  }

  private hashMatchesOtp(otp: string, storedHash: string) {
    const submitted = Buffer.from(this.hashResetOtp(otp), 'hex');
    const stored = Buffer.from(storedHash, 'hex');
    return submitted.length === stored.length && timingSafeEqual(submitted, stored);
  }

  private hashMatches(token: string, storedHash: string) {
    const submitted = Buffer.from(this.hashResetToken(token), 'hex');
    const stored = Buffer.from(storedHash, 'hex');
    return submitted.length === stored.length && timingSafeEqual(submitted, stored);
  }

  private createAccessToken(user: User, sessionId: string) {
    return this.jwtService.signAsync(
      { sub: user.id, sid: sessionId, username: user.username, role: user.role.role, type: 'access' },
      { expiresIn: '15m', issuer: 'ncc-backend' },
    );
  }

}
