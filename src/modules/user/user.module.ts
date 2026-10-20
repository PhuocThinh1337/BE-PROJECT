import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { Role } from '../role/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
