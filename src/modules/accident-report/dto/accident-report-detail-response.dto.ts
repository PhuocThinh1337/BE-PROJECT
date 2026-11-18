import { AccidentReportPeriod, AccidentReportStatus } from '../accident-report.entity';
import { AccidentDetailDto, AccidentStatsDto } from './accident-report.dto';

export interface AccidentReportDetailResponse {
  accidentReportId: string;
  enterpriseId: string;
  year: number;
  reportPeriod: AccidentReportPeriod;
  status: AccidentReportStatus;
  note: string;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedByUserId: string | null;
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
    fileId: string;
    fileName: string;
    contentType: string;
    size: number;
    url: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSummaryDamage {
  totalDaysOff: number;
  totalExpense: number;
  medicalExpense: number;
  salaryExpenseDuringTreatment: number;
  compensationExpense: number;
  propertyDamageExpense: number;
}

export interface ReportSummaryBusinessMetrics {
  totalBusinesses: number;
  reportedBusinesses: number;
  totalEmployees: number;
  reportedEmployees: number;
  femaleEmployees: number;
  accidentFrequency: number;
  fatalFrequency: number;
}

export interface ReportSummaryCategory extends AccidentStatsDto {
  categoryId: string;
  name: string;
  code: string;
}

export interface ReportSummaryBusinessType extends AccidentStatsDto, ReportSummaryBusinessMetrics {
  businessTypeId: string;
  name: string;
  code: string;
}

export interface OverallAccidentReportResponse {
  year: number;
  businessTypes: ReportSummaryBusinessType[];
  total1: AccidentStatsDto & ReportSummaryBusinessMetrics;
  injuryTypes: ReportSummaryCategory[];
  injuryFactors: ReportSummaryCategory[];
  occupations: ReportSummaryCategory[];
  total2: AccidentStatsDto & ReportSummaryDamage;
}
