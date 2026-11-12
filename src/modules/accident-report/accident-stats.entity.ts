import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AccidentReport } from './accident-report.entity';

@Entity('accident_stats')
@Unique('UQ_accident_stats_report_subsidized', ['accidentReportId', 'isSubsidizedAccident'])
export class AccidentStats {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) accidentReportId: string;
  @ManyToOne(() => AccidentReport, (report) => report.stats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accidentReportId' }) accidentReport: AccidentReport;
  @Column({ type: 'boolean', default: false }) isSubsidizedAccident: boolean;
  @Column({ type: 'integer', default: 0 }) totalCases: number;
  @Column({ type: 'integer', default: 0 }) fatalCases: number;
  @Column({ type: 'integer', default: 0 }) totalCasesWithTwoOrMoreVictims: number;
  @Column({ type: 'integer', default: 0 }) totalDaysOff: number;
  @Column({ type: 'double precision', default: 0 }) totalExpense: number;
  @Column({ type: 'integer', default: 0 }) totalVictims: number;
  @Column({ type: 'double precision', default: 0 }) medicalExpense: number;
  @Column({ type: 'integer', default: 0 }) nonManagedVictims: number;
  @Column({ type: 'integer', default: 0 }) totalFatalVictims: number;
  @Column({ type: 'integer', default: 0 }) totalFemaleVictims: number;
  @Column({ type: 'double precision', default: 0 }) compensationExpense: number;
  @Column({ type: 'double precision', default: 0 }) propertyDamageExpense: number;
  @Column({ type: 'integer', default: 0 }) nonManagedFatalVictims: number;
  @Column({ type: 'integer', default: 0 }) nonManagedFemaleVictims: number;
  @Column({ type: 'integer', default: 0 }) totalSeverelyInjuredVictims: number;
  @Column({ type: 'double precision', default: 0 }) salaryExpenseDuringTreatment: number;
  @Column({ type: 'integer', default: 0 }) nonManagedSeverelyInjuredVictims: number;
}
