import { BadRequestException, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  canActivate(context: ExecutionContext) {
    const { username, password } = context.switchToHttp().getRequest().body || {};
    if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
      throw new BadRequestException('username and password are required');
    }
    return super.canActivate(context);
  }
}
