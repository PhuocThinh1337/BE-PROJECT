import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt, randomUUID, timingSafeEqual } from 'crypto';
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

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    @InjectRepository(AuthSession) private readonly sessionRepository: Repository<AuthSession>,
    @InjectRepository(EmailChangeRequest) private readonly emailChangeRepository: Repository<EmailChangeRequest>,
  ) {}

  async login(user: User, rememberMe = false) {
    const sessionId = randomUUID();
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, sid: sessionId, type: 'refresh' },
      { secret: this.config.get<string>('jwt.refreshSecret'), expiresIn: rememberMe ? '30d' : '1d', issuer: 'ncc-backend' },
    );
    const refreshTtl = rememberMe ? 30 : 1;
    await this.sessionRepository.save(this.sessionRepository.create({
      id: sessionId, userId: user.id, refreshTokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshTtl * 24 * 60 * 60 * 1000),
    }));
    return {
      success: true, message: 'Login successful',
      data: { accessToken: await this.createAccessToken(user, sessionId), refreshToken, tokenType: 'Bearer', expiresIn: 900,
        user: { id: user.id, username: user.username, role: user.role.role } },
    };
  }

  async me(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return { success: true, data: this.userService.toUserDetail(user) };
  }

  async requestEmailChange(userId: string, newEmail: string) {
    const normalizedEmail = newEmail.trim().toLowerCase();
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException();
    if (user.email?.toLowerCase() === normalizedEmail) throw new BadRequestException('New email must differ from current email.');
    if (await this.userService.findByEmail(normalizedEmail)) throw new ConflictException('Email is already in use.');
    await this.emailChangeRepository.delete({ userId });
    await this.emailChangeRepository.delete({ newEmail: normalizedEmail });
    const otp = randomInt(100000, 1000000).toString();
    const request = this.emailChangeRepository.create({
      id: randomUUID(), userId, newEmail: normalizedEmail, otpHash: this.hashToken(otp),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), attempts: 0, verifiedAt: null,
    });
    await this.emailChangeRepository.save(request);
    try {
      await this.mailService.sendEmailChangeOtp(normalizedEmail, otp);
    } catch (error) {
      await this.emailChangeRepository.delete({ id: request.id });
      throw error;
    }
    return { success: true, message: 'Verification code sent to the new email address.' };
  }

  async verifyEmailChange(userId: string, otp: string) {
    const request = await this.emailChangeRepository.findOne({ where: { userId } });
    if (!request || request.expiresAt.getTime() <= Date.now()) {
      if (request) await this.emailChangeRepository.delete({ id: request.id });
      throw new BadRequestException('Email verification code is invalid or expired.');
    }
    if (request.attempts >= 5) {
      await this.emailChangeRepository.delete({ id: request.id });
      throw new BadRequestException('Too many verification attempts. Request a new code.');
    }
    if (!this.hashMatches(otp, request.otpHash)) {
      request.attempts += 1;
      await this.emailChangeRepository.save(request);
      throw new BadRequestException('Email verification code is invalid or expired.');
    }
    const existing = await this.userService.findByEmail(request.newEmail);
    if (existing && existing.id !== userId) throw new ConflictException('Email is already in use.');
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException();
    user.email = request.newEmail;
    await this.userService.save(user);
    await this.emailChangeRepository.delete({ id: request.id });
    return { success: true, message: 'Email address updated successfully.' };
  }

  async refresh(refreshToken: string) {
    let claims: any;
    try {
      claims = await this.jwtService.verifyAsync(refreshToken, { secret: this.config.get<string>('jwt.refreshSecret'), issuer: 'ncc-backend' });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }
    if (claims.type !== 'refresh' || !claims.sid || !claims.sub) throw new UnauthorizedException('Refresh token is invalid.');
    const session = await this.sessionRepository.findOne({ where: { id: claims.sid, userId: claims.sub } });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now() || !this.hashMatches(refreshToken, session.refreshTokenHash)) {
      throw new UnauthorizedException('Refresh token is invalid or revoked.');
    }
    const user = await this.userService.findById(claims.sub);
    if (!user) throw new UnauthorizedException();
    if (user.status) throw new ForbiddenException('Account is locked.');
    if (!user.isActive) throw new ForbiddenException('Account is inactive.');
    const nextToken = await this.jwtService.signAsync(
      { sub: user.id, sid: session.id, type: 'refresh' },
      { secret: this.config.get<string>('jwt.refreshSecret'), expiresIn: Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)), issuer: 'ncc-backend' },
    );
    session.refreshTokenHash = this.hashToken(nextToken);
    await this.sessionRepository.save(session);
    return { success: true, data: { accessToken: await this.createAccessToken(user, session.id), refreshToken: nextToken, tokenType: 'Bearer', expiresIn: 900 } };
  }

  async logout(userId: string, sessionId: string) {
    await this.sessionRepository.update({ id: sessionId, userId, revokedAt: IsNull() }, { revokedAt: new Date() });
    return { success: true, message: 'Logged out successfully.' };
  }

  async changePassword(userId: string, input: ChangePasswordDto) {
    if (input.newPassword !== input.confirmNewPassword) throw new BadRequestException('New password confirmation does not match.');
    const user = await this.userService.findByIdForPassword(userId);
    if (!user || !(await argon2.verify(user.password, input.currentPassword))) throw new BadRequestException('Current password is incorrect.');
    if (input.currentPassword === input.newPassword) throw new BadRequestException('New password must differ from current password.');
    user.password = await argon2.hash(input.newPassword);
    await this.userService.save(user);
    await this.sessionRepository.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
    return { success: true, message: 'Password changed. Please log in again.' };
  }

  async initializePassword(userId: string, password: string) {
    const user = await this.userService.findByIdForPassword(userId);
    if (!user) throw new UnauthorizedException('Account not found.');
    user.password = await argon2.hash(password);
    await this.userService.save(user);
    await this.sessionRepository.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
    return { success: true, message: 'Password initialized. Please log in again.' };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userService.findByEmailForReset(normalizedEmail);
    const response = { success: true, message: 'If the email belongs to an account, an OTP has been sent.' };
    if (!user) return response;
    const otp = randomInt(100000, 1000000).toString();
    user.resetPasswordTokenHash = this.hashToken(otp);
    user.resetPasswordExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    user.resetPasswordAttempts = 0;
    await this.userService.save(user);
    try {
      await this.mailService.sendPasswordResetOtp(normalizedEmail, otp, user.username, user.fullname || user.username);
    } catch (error) {
      user.resetPasswordTokenHash = null;
      user.resetPasswordExpiresAt = null;
      user.resetPasswordAttempts = 0;
      await this.userService.save(user);
      throw error;
    }
    return response;
  }

  async resetPassword(input: ResetPasswordDto) {
    const user = await this.userService.findByEmailForReset(input.email.trim().toLowerCase());
    if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt.getTime() <= Date.now()) throw new BadRequestException('OTP is invalid or expired.');
    if (user.resetPasswordAttempts >= 5) throw new BadRequestException('Too many OTP attempts. Request a new OTP.');
    if (input.newPassword !== input.confirmNewPassword) throw new BadRequestException('New password confirmation does not match.');
    if (!this.hashMatches(input.otpCode, user.resetPasswordTokenHash)) {
      user.resetPasswordAttempts += 1;
      if (user.resetPasswordAttempts >= 5) {
        user.resetPasswordTokenHash = null;
        user.resetPasswordExpiresAt = null;
      }
      await this.userService.save(user);
      throw new BadRequestException('OTP is invalid or expired.');
    }
    user.password = await argon2.hash(input.newPassword);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    user.resetPasswordAttempts = 0;
    await this.userService.save(user);
    await this.sessionRepository.update({ userId: user.id, revokedAt: IsNull() }, { revokedAt: new Date() });
    return { success: true, message: 'Password has been reset successfully.' };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private hashMatches(token: string, storedHash: string) {
    if (!storedHash) return false;
    const submitted = Buffer.from(this.hashToken(token), 'hex');
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
