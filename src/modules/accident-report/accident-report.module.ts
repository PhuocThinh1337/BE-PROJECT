import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Enterprise } from '../enterprise/enterprise.entity';
import { AccidentCategory } from './accident-category.entity';
import { AccidentReport } from './accident-report.entity';
import { AccidentReportController } from './accident-report.controller';
import { AccidentReportService } from './accident-report.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([AccidentReport, AccidentCategory, Enterprise])],
  controllers: [AccidentReportController],
  providers: [AccidentReportService],
})
export class AccidentReportModule {}
