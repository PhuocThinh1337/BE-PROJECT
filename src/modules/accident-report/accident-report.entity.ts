import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Enterprise } from '../enterprise/enterprise.entity';
import { AccidentStats } from './accident-stats.entity';
import { AccidentReportDetail } from './accident-report-detail.entity';

export enum AccidentReportPeriod {
  SIX_MONTHS = 'SIX_MONTHS',
  FULL_YEAR = 'FULL_YEAR',
}

export enum AccidentReportStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  ACCEPTED = 'ACCEPTED',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

@Entity('accident_reports')
@Index('UQ_accident_reports_enterprise_year_period', ['enterpriseId', 'year', 'reportPeriod'], { unique: true })
export class AccidentReport {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'uuid' }) enterpriseId: string;
  @ManyToOne(() => Enterprise, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterpriseId' }) enterprise: Enterprise;

  @Column({ type: 'int' }) year: number;
  @Column({ length: 20 }) reportPeriod: AccidentReportPeriod;
  @Column({ length: 20, default: AccidentReportStatus.PENDING }) status: AccidentReportStatus;
  @Column({ type: 'text', nullable: true }) note: string | null;

  @Column({ type: 'int', nullable: true }) totalEmployees: number | null;
  @Column({ type: 'int', nullable: true }) femaleEmployees: number | null;
  @Column({ type: 'double precision', nullable: true }) totalSalaryFund: number | null;
  @OneToMany(() => AccidentStats, (stats) => stats.accidentReport) stats: AccidentStats[];
  @OneToMany(() => AccidentReportDetail, (link) => link.accidentReport) detailLinks: AccidentReportDetail[];

  @Column({ nullable: true }) stampedReportUrl: string | null;
  @Column({ type: 'uuid', nullable: true }) stampedReportFileId: string | null;
  @Column({ nullable: true }) stampedReportFileName: string | null;
  @Column({ nullable: true, length: 150 }) stampedReportContentType: string | null;
  @Column({ type: 'int', nullable: true }) stampedReportSize: number | null;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
