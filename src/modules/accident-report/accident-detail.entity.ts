import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AccidentReportDetail } from './accident-report-detail.entity';

@Entity('accident_details')
export class AccidentDetail {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) injuryTypeId: string;
  @Column({ type: 'uuid' }) injuryFactorId: string;
  @Column({ type: 'uuid' }) occupationId: string;
  @Column({ type: 'integer', default: 0 }) totalVictims: number;
  @Column({ type: 'integer', default: 0 }) nonManagedVictims: number;
  @Column({ type: 'integer', default: 0 }) totalFemaleVictims: number;
  @Column({ type: 'integer', default: 0 }) nonManagedFemaleVictims: number;
  @Column({ type: 'integer', default: 0 }) totalFatalVictims: number;
  @Column({ type: 'integer', default: 0 }) nonManagedFatalVictims: number;
  @Column({ type: 'integer', default: 0 }) totalSeverelyInjuredVictims: number;
  @Column({ type: 'integer', default: 0 }) nonManagedSeverelyInjuredVictims: number;
  @Column({ type: 'double precision', default: 0 }) medicalExpense: number;
  @Column({ type: 'double precision', default: 0 }) salaryExpenseDuringTreatment: number;
  @Column({ type: 'double precision', default: 0 }) compensationExpense: number;
  @Column({ type: 'double precision', default: 0 }) totalExpense: number;
  @Column({ type: 'integer', default: 0 }) totalDaysOff: number;
  @Column({ type: 'double precision', default: 0 }) propertyDamageExpense: number;
  @OneToMany(() => AccidentReportDetail, (link) => link.accidentDetail) reportLinks: AccidentReportDetail[];
}
