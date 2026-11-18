import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Enterprise } from '../enterprise/enterprise.entity';
import { AccidentCategory } from './accident-category.entity';
import { AccidentReport } from './accident-report.entity';
import { AccidentStats } from './accident-stats.entity';
import { AccidentDetail } from './accident-detail.entity';
import { AccidentReportDetail } from './accident-report-detail.entity';
import { AccidentReportController } from './accident-report.controller';
import { AccidentReportService } from './accident-report.service';
import { ReportPeriodConfig } from './report-period-config.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([AccidentReport, AccidentCategory, AccidentStats, AccidentDetail, AccidentReportDetail, ReportPeriodConfig, Enterprise])],
  controllers: [AccidentReportController],
  providers: [AccidentReportService],
})
export class AccidentReportModule {}
