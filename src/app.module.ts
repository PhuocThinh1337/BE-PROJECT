import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { Role } from './modules/role/role.entity';
import { User } from './modules/user/user.entity';
import { AuthSession } from './modules/auth/auth-session.entity';
import { CreateAuthSessions1700000000000 } from './database/migrations/1700000000000-CreateAuthSessions';
import { AddUserProfileAndEmailChangeRequests1710000000000 } from './database/migrations/1710000000000-AddUserProfileAndEmailChangeRequests';
import { EmailChangeRequest } from './modules/auth/email-change-request.entity';
import { AddResetPasswordOtpAttempts1720000000000 } from './database/migrations/1720000000000-AddResetPasswordOtpAttempts';
import { AddEmailChangeVerifiedAt1730000000000 } from './database/migrations/1730000000000-AddEmailChangeVerifiedAt';
import { ConvertRoleIdsToUuid1740000000000 } from './database/migrations/1740000000000-ConvertRoleIdsToUuid';
import { CreateEnterpriseTables1750000000000 } from './database/migrations/1750000000000-CreateEnterpriseTables';
import { AlignEnterpriseContracts1760000000000 } from './database/migrations/1760000000000-AlignEnterpriseContracts';
import { AddEnterpriseFileMetadata1770000000000 } from './database/migrations/1770000000000-AddEnterpriseFileMetadata';
import { ExpandEnterpriseTaxCodeLength1780000000000 } from './database/migrations/1780000000000-ExpandEnterpriseTaxCodeLength';
import { Enterprise } from './modules/enterprise/enterprise.entity';
import { BusinessIndustry, BusinessType } from './modules/enterprise/enterprise-reference.entity';
import { EnterpriseModule } from './modules/enterprise/enterprise.module';
import { load } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [load] }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.VNA_DB_HOST,
      port: Number(process.env.VNA_DB_PORT || 5432),
      username: process.env.VNA_DB_USER,
      password: process.env.VNA_DB_PASSWORD,
      database: process.env.VNA_DB_DATABASE,
      entities: [User, Role, AuthSession, EmailChangeRequest, Enterprise, BusinessType, BusinessIndustry],
      migrations: [
        CreateAuthSessions1700000000000,
        AddUserProfileAndEmailChangeRequests1710000000000,
        AddResetPasswordOtpAttempts1720000000000,
        AddEmailChangeVerifiedAt1730000000000,
        ConvertRoleIdsToUuid1740000000000,
        CreateEnterpriseTables1750000000000,
        AlignEnterpriseContracts1760000000000,
        AddEnterpriseFileMetadata1770000000000,
        ExpandEnterpriseTaxCodeLength1780000000000,
      ],
      synchronize: process.env.VNA_DB_SYNCHRONIZE === 'true',
      migrationsRun: process.env.VNA_DB_MIGRATIONS_RUN === 'true',
    }),
    AuthModule,
    EnterpriseModule,
  ],
})
export class AppModule {}
