import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuthSession } from './auth-session.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(AuthSession) private readonly sessions: Repository<AuthSession>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Bearer access token is required');

    let claims: any;
    try {
      claims = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('jwt.secret'), issuer: 'ncc-backend',
      });
      if (claims.type !== 'access' || !claims.sub || !claims.sid) throw new Error('Invalid access token');
    } catch (_error) {
      throw new UnauthorizedException('Access token is invalid or expired');
    }

    const session = await this.sessions.findOne({
      where: { id: claims.sid, userId: claims.sub, revokedAt: IsNull() },
      relations: ['user', 'user.role'],
    });
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Session is revoked or expired');
    }
    if (!session.user || session.user.status) throw new ForbiddenException('Account is locked');
    request.user = {
      id: session.user.id,
      sessionId: claims.sid,
      username: session.user.username,
      role: session.user.role.role,
    };
    return true;
  }
}
