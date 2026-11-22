import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AccidentReportPeriod } from './accident-report.entity';

@Entity('report_period_deadlines')
@Index('UQ_report_period_deadlines_year_period', ['year', 'period'], { unique: true })
export class ReportPeriodDeadline {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'int' }) year: number;
  @Column({ length: 20 }) period: AccidentReportPeriod;
  @Column({ type: 'timestamptz' }) deadlineAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
