import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { MailService } from './mail.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSession } from './auth-session.entity';
import { EmailChangeRequest } from './email-change-request.entity';
import { EmailOtp } from './email-otp.entity';
import { UserController } from '../user/user.controller';
import { RoleController } from '../role/role.controller';
import { Role } from '../role/role.entity';
import { RoleService } from '../role/role.service';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { Enterprise } from '../enterprise/enterprise.entity';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([AuthSession, EmailChangeRequest, EmailOtp, Role, Enterprise]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: '1d', issuer: 'ncc-backend' },
      }),
    }),
  ],
  controllers: [AuthController, UserController, RoleController],
  providers: [AuthService, LocalStrategy, JwtAuthGuard, OptionalJwtAuthGuard, MailService, RoleService],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}

