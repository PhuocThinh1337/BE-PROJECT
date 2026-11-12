import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AccidentReport } from './accident-report.entity';
import { AccidentDetail } from './accident-detail.entity';

@Entity('accident_report_details')
@Unique('UQ_accident_report_details_pair', ['accidentReportId', 'accidentDetailId'])
export class AccidentReportDetail {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) accidentReportId: string;
  @ManyToOne(() => AccidentReport, (report) => report.detailLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accidentReportId' }) accidentReport: AccidentReport;
  @Column({ type: 'uuid' }) accidentDetailId: string;
  @ManyToOne(() => AccidentDetail, (detail) => detail.reportLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accidentDetailId' }) accidentDetail: AccidentDetail;
}
