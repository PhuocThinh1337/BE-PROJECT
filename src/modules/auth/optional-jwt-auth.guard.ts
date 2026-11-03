import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthSession } from './auth-session.entity';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  constructor(
    jwtService: JwtService,
    config: ConfigService,
    @InjectRepository(AuthSession) sessions: Repository<AuthSession>,
  ) {
    super(jwtService, config, sessions);
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!request.headers.authorization) return Promise.resolve(true);
    return super.canActivate(context);
  }
}
