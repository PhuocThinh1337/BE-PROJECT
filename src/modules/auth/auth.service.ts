import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import * as argon2 from 'argon2';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { MailService } from './mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthSession } from './auth-session.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    @InjectRepository(AuthSession)
    private readonly sessionRepository: Repository<AuthSession>,
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
    if (!user) throw new UnauthorizedException();
    return { success: true, data: this.toPublicUser(user) };
  }

  async refresh(refreshToken: string) {
    let claims: any;
    try {
      claims = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'), issuer: 'ncc-backend',
      });
    } catch (_error) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
    if (claims.type !== 'refresh' || !claims.sid || !claims.sub) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const session = await this.sessionRepository.findOne({ where: { id: claims.sid, userId: claims.sub } });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now() ||
      !this.hashMatches(refreshToken, session.refreshTokenHash)) {
      throw new UnauthorizedException('Refresh token is invalid or revoked');
    }

    const user = await this.userService.findById(claims.sub);
    if (!user) throw new UnauthorizedException();
    if (user.status) throw new ForbiddenException('Account is locked');

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
    return { success: true, message: 'Logged out successfully.' };
  }

  async changePassword(userId: string, input: ChangePasswordDto) {
    const user = await this.userService.findByIdForPassword(userId);
    if (!user || !(await argon2.verify(user.password, input.currentPassword))) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException('New password must differ from current password');
    }
    user.password = await argon2.hash(input.newPassword);
    await this.userService.save(user);
    await this.sessionRepository.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
    return { success: true, message: 'Password changed. Please log in again.' };
  }

  async forgotPassword(email: string) {
    const genericResponse = {
      success: true,
      message: 'If this email belongs to an account, a reset link will be sent.',
    };
    const resetPage = this.config.get<string>('mail.resetPage');
    if (!resetPage) {
      throw new ServiceUnavailableException('Password reset page URL is not configured');
    }
    let resetUrl: URL;
    try {
      resetUrl = new URL(resetPage);
    } catch (_error) {
      throw new ServiceUnavailableException('Password reset page URL is invalid');
    }

    const user = await this.userService.findByEmail(email);
    if (!user) return genericResponse;

    const token = randomBytes(32).toString('hex');
    user.resetPasswordTokenHash = this.hashResetToken(token);
    user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.userService.save(user);

    resetUrl.searchParams.set('token', token);
    resetUrl.searchParams.set('email', email);

    try {
      await this.mailService.sendPasswordReset(email, resetUrl.toString());
    } catch (error) {
      user.resetPasswordTokenHash = null;
      user.resetPasswordExpiresAt = null;
      await this.userService.save(user);
      throw error;
    }

    return genericResponse;
  }

  async resetPassword(input: ResetPasswordDto) {
    const user = await this.userService.findByEmailForReset(input.email);
    const submittedHash = this.hashResetToken(input.token);
    const storedHash = user?.resetPasswordTokenHash;
    const hashMatches = !!storedHash && timingSafeEqual(
      Buffer.from(submittedHash, 'hex'),
      Buffer.from(storedHash, 'hex'),
    );

    if (
      !user ||
      !hashMatches ||
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Reset token is invalid or expired');
    }

    user.password = await argon2.hash(input.newPassword);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await this.userService.save(user);
    await this.sessionRepository.update({ userId: user.id, revokedAt: IsNull() }, { revokedAt: new Date() });

    return { success: true, message: 'Password has been reset successfully.' };
  }

  private hashResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
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

  private toPublicUser(user: User) {
    return { id: user.id, username: user.username, email: user.email, role: user.role.role };
  }
}
