import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AccidentReportPeriod } from './accident-report.entity';

@Entity('report_period_configs')
export class ReportPeriodConfig {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true, length: 20 }) period: AccidentReportPeriod;
  @Column({ default: true }) enabled: boolean;
  @Column({ type: 'int' }) deadlineMonth: number;
  @Column({ type: 'int' }) deadlineDay: number;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) requiredFields: string[];
  @Column({ type: 'text', nullable: true }) description: string | null;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}