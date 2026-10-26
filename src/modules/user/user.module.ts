import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { Role } from '../role/role.entity';
import { AuthSession } from '../auth/auth-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, AuthSession])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
