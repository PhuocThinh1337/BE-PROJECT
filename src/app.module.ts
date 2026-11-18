import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { Role } from './modules/role/role.entity';
import { User } from './modules/user/user.entity';
import { AuthSession } from './modules/auth/auth-session.entity';
import { EmailOtp } from './modules/auth/email-otp.entity';
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
import { AddEmailOtpsAndVietnamTaxCodeFormat1790000000000 } from './database/migrations/1790000000000-AddEmailOtpsAndVietnamTaxCodeFormat';
import { BackfillEnterpriseTaxCodes1800000000000 } from './database/migrations/1800000000000-BackfillEnterpriseTaxCodes';
import { CreateAccidentReports1810000000000 } from './database/migrations/1810000000000-CreateAccidentReports';
import { Enterprise } from './modules/enterprise/enterprise.entity';
import { BusinessIndustry, BusinessType } from './modules/enterprise/enterprise-reference.entity';
import { EnterpriseModule } from './modules/enterprise/enterprise.module';
import { load } from './config';
import { AccidentReport } from './modules/accident-report/accident-report.entity';
import { AccidentCategory } from './modules/accident-report/accident-category.entity';
import { AccidentStats } from './modules/accident-report/accident-stats.entity';
import { AccidentDetail } from './modules/accident-report/accident-detail.entity';
import { AccidentReportDetail } from './modules/accident-report/accident-report-detail.entity';
import { NormalizeAccidentReportTables1820000000000 } from './database/migrations/1820000000000-NormalizeAccidentReportTables';
import { AddAccidentStampedFileId1830000000000 } from './database/migrations/1830000000000-AddAccidentStampedFileId';
import { AddAccidentReportReview1840000000000 } from './database/migrations/1840000000000-AddAccidentReportReview';
import { CreateReportConfiguration1850000000000 } from './database/migrations/1850000000000-CreateReportConfiguration';
import { AddAccidentReportAudit1860000000000 } from './database/migrations/1860000000000-AddAccidentReportAudit';
import { ReportPeriodConfig } from './modules/accident-report/report-period-config.entity';
import { AccidentReportModule } from './modules/accident-report/accident-report.module';

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
      entities: [User, Role, AuthSession, EmailChangeRequest, EmailOtp, Enterprise, BusinessType, BusinessIndustry, AccidentReport, AccidentCategory, AccidentStats, AccidentDetail, AccidentReportDetail, ReportPeriodConfig],
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
        AddEmailOtpsAndVietnamTaxCodeFormat1790000000000,
        BackfillEnterpriseTaxCodes1800000000000,
        CreateAccidentReports1810000000000,
        NormalizeAccidentReportTables1820000000000,
        AddAccidentStampedFileId1830000000000,
        AddAccidentReportReview1840000000000,
        CreateReportConfiguration1850000000000,
        AddAccidentReportAudit1860000000000,
      ],
      synchronize: process.env.VNA_DB_SYNCHRONIZE === 'true',
      migrationsRun: process.env.VNA_DB_MIGRATIONS_RUN === 'true',
    }),
    AuthModule,
    EnterpriseModule,
    AccidentReportModule,
  ],
})
export class AppModule {}
