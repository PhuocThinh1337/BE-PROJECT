import { AccidentReportPeriod, AccidentReportStatus } from '../accident-report.entity';
import { AccidentDetailDto, AccidentStatsDto } from './accident-report.dto';

export interface AccidentReportDetailResponse {
  accidentReportId: string;
  enterpriseId: string;
  year: number;
  reportPeriod: AccidentReportPeriod;
  status: AccidentReportStatus;
  companyName: string;
  taxCode: string;
  businessTypeName: string;
  businessIndustryName: string;
  totalEmployees: number | null;
  femaleEmployees: number | null;
  totalSalaryFund: number | null;
  accidentTotals: AccidentStatsDto | null;
  accidentDetails: AccidentDetailDto[] | null;
  subsidizedAccident: AccidentStatsDto | null;
  stampedReport: {
    fileName: string;
    contentType: string;
    size: number;
    url: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}
