import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../role/role.entity';
import { AuthSession } from '../auth/auth-session.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserModule } from '../user/user.module';
import { EnterpriseController } from './enterprise.controller';
import { Enterprise } from './enterprise.entity';
import { BusinessIndustry, BusinessType } from './enterprise-reference.entity';
import { EnterpriseService } from './enterprise.service';
import { EnterpriseReferenceController } from './enterprise-reference.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enterprise, BusinessType, BusinessIndustry, Role, AuthSession]),
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: '1d', issuer: 'ncc-backend' },
      }),
    }),
  ],
  controllers: [EnterpriseController, EnterpriseReferenceController],
  providers: [EnterpriseService, JwtAuthGuard],
})
export class EnterpriseModule {}
