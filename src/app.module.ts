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
      entities: [User, Role, AuthSession, EmailChangeRequest],
      migrations: [
        CreateAuthSessions1700000000000,
        AddUserProfileAndEmailChangeRequests1710000000000,
        AddResetPasswordOtpAttempts1720000000000,
        AddEmailChangeVerifiedAt1730000000000,
      ],
      synchronize: process.env.VNA_DB_SYNCHRONIZE === 'true',
      migrationsRun: process.env.VNA_DB_MIGRATIONS_RUN === 'true',
    }),
    AuthModule,
  ],
})
export class AppModule {}
