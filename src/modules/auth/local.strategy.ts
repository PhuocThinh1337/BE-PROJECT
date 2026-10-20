import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import * as argon2 from 'argon2';
import { UserService } from '../user/user.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super();
  }

  async validate(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (!user || !(await argon2.verify(user.password, password))) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại.');
    }
    if (user.status === true) {
      throw new ForbiddenException('Tài khoản đã bị khóa.');
    }
    if (user.isActive === false) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa.');
    }
    return user;
  }
}
