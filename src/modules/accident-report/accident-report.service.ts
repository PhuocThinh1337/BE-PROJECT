import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { Enterprise } from '../enterprise/enterprise.entity';
import { AccidentCategory, AccidentCategoryType } from './accident-category.entity';
import { AccidentReport, AccidentReportPeriod, AccidentReportStatus } from './accident-report.entity';
import { AccidentStats } from './accident-stats.entity';
import { AccidentDetail } from './accident-detail.entity';
import { AccidentReportDetail } from './accident-report-detail.entity';
import { AccidentDetailDto, AccidentStatsDto, ListAccidentReportsDto, ReviewAccidentReportsDto, UpdateAccidentReportDto } from './dto/accident-report.dto';
import { AccidentReportDetailResponse } from './dto/accident-report-detail-response.dto';

const victimFields = [
  'totalCases', 'fatalCases', 'totalCasesWithTwoOrMoreVictims', 'totalVictims', 'nonManagedVictims',
  'totalFemaleVictims', 'nonManagedFemaleVictims', 'totalFatalVictims', 'nonManagedFatalVictims',
  'totalSeverelyInjuredVictims', 'nonManagedSeverelyInjuredVictims',
];
const expenseFields = ['medicalExpense', 'salaryExpenseDuringTreatment', 'compensationExpense', 'totalExpense', 'totalDaysOff', 'propertyDamageExpense'];
interface ReportPdfFile { originalname: string; mimetype: string; size: number; buffer: Buffer; }
const zeroStats = () => [...victimFields, ...expenseFields].reduce((result, field) => {
  result[field] = 0;
  return result;
}, {} as Record<string, number>);
const numberValue = (value: any) => Number(value || 0);

@Injectable()
export class AccidentReportService implements OnModuleInit {
  constructor(
    @InjectRepository(AccidentReport) private readonly reports: Repository<AccidentReport>,
    @InjectRepository(Enterprise) private readonly enterprises: Repository<Enterprise>,
    @InjectRepository(AccidentCategory) private readonly categories: Repository<AccidentCategory>,
    @InjectRepository(AccidentStats) private readonly stats: Repository<AccidentStats>,
    @InjectRepository(AccidentDetail) private readonly details: Repository<AccidentDetail>,
    @InjectRepository(AccidentReportDetail) private readonly detailLinks: Repository<AccidentReportDetail>,
  ) {}

  async onModuleInit() {
    await this.ensureReportsForYear(new Date().getFullYear());
  }

  async ensureReportsForYear(year: number) {
    const enterprises = await this.enterprises.find({ select: ['id'] });
    if (!enterprises.length) return;
    const values = enterprises.reduce((result, { id }) => result.concat(
      [AccidentReportPeriod.SIX_MONTHS, AccidentReportPeriod.FULL_YEAR].map((reportPeriod) => ({
        enterpriseId: id, year, reportPeriod, status: AccidentReportStatus.PENDING,
      })),
    ), [] as any[]);
    await this.reports.createQueryBuilder().insert().values(values as any)
      .onConflict('("enterpriseId", "year", "reportPeriod") DO NOTHING').execute();
    const now = new Date();
    const statuses = [AccidentReportStatus.PENDING, AccidentReportStatus.IN_PROGRESS, AccidentReportStatus.ACCEPTED];
    if (now >= new Date(year, 6, 5)) await this.reports.createQueryBuilder().update().set({ status: AccidentReportStatus.EXPIRED })
      .where('"year" = :year AND "reportPeriod" = :period AND "status" IN (:...statuses)', { year, period: AccidentReportPeriod.SIX_MONTHS, statuses }).execute();
    if (now >= new Date(year + 1, 0, 10)) await this.reports.createQueryBuilder().update().set({ status: AccidentReportStatus.EXPIRED })
      .where('"year" = :year AND "reportPeriod" = :period AND "status" IN (:...statuses)', { year, period: AccidentReportPeriod.FULL_YEAR, statuses }).execute();
  }

  private deadline(report: AccidentReport) {
    return report.reportPeriod === AccidentReportPeriod.SIX_MONTHS
      ? new Date(report.year, 6, 5, 0, 0, 0, 0)
      : new Date(report.year + 1, 0, 10, 0, 0, 0, 0);
  }

  private async expireIfOverdue(report: AccidentReport) {
    if ([AccidentReportStatus.PENDING, AccidentReportStatus.IN_PROGRESS, AccidentReportStatus.ACCEPTED].includes(report.status) && new Date() >= this.deadline(report)) {
      report.status = AccidentReportStatus.EXPIRED;
      await this.reports.save(report);
    }
    return report;
  }

  async reviewReports(input: ReviewAccidentReportsDto) {
    const reports = await this.reports.find({ where: { id: In(input.accidentReportIds) } });
    if (reports.length !== new Set(input.accidentReportIds).size) throw new NotFoundException('Không tìm thấy một hoặc nhiều báo cáo.');
    for (const report of reports) await this.expireIfOverdue(report);
    if (reports.some((report) => report.status !== AccidentReportStatus.ACCEPTED)) throw new ConflictException('Chỉ được duyệt hoặc từ chối báo cáo đang ở trạng thái ACCEPTED và chưa quá hạn.');
    for (const report of reports) { report.status = input.status; report.note = input.note; }
    await this.reports.save(reports);
    return { message: 'Cập nhật trạng thái báo cáo thành công.', data: reports.map((report) => ({ accidentReportId: report.id, status: report.status, note: report.note })) };
  }

  async listForDepartment(query: ListAccidentReportsDto) {
    const year = await this.resolveYear(query.year);
    const builder = this.baseListQuery().where('report.year = :year', { year });
    this.applyFilters(builder, query);
    return this.paginate(builder, query.page, query.size);
  }

  async listForEnterprise(userId: string, query: ListAccidentReportsDto) {
    const year = await this.resolveYear(query.year);
    const builder = this.baseListQuery().where('enterprise.userId = :userId', { userId }).andWhere('report.year = :year', { year });
    this.applyFilters(builder, query);
    return this.paginate(builder, query.page, query.size);
  }

  async getCategories(type: AccidentCategoryType) {
    const records = await this.categories.find({ where: { type, isActive: true }, order: { name: 'ASC' } });
    return { message: 'Lấy danh mục thành công.', data: records.map(({ id, code, name, type: categoryType }) => ({ categoryId: id, code, name, type: categoryType })) };
  }

  async getReport(id: string, userId: string, role: string) {
    const report = await this.expireIfOverdue(await this.findReport(id));
    this.assertCanView(report, userId, role);
    return { message: 'Lấy báo cáo tai nạn lao động thành công.', data: this.toDetail(report) };
  }

  async updateReport(id: string, userId: string, role: string, input: UpdateAccidentReportDto, stampedReport?: ReportPdfFile) {
    if (role !== 'DOANH_NGHIEP') throw new ForbiddenException('Chỉ tài khoản doanh nghiệp mới được khai báo báo cáo.');
    const report = await this.findReport(id);
    if (report.enterprise.userId !== userId) throw new ForbiddenException('Bạn không có quyền cập nhật báo cáo này.');
    await this.expireIfOverdue(report);
    if ([AccidentReportStatus.ACCEPTED, AccidentReportStatus.APPROVED, AccidentReportStatus.DECLINED, AccidentReportStatus.EXPIRED].includes(report.status)) throw new ConflictException('Báo cáo đã khóa và chỉ được xem.');

    if (input.totalEmployees !== undefined) report.totalEmployees = input.totalEmployees;
    if (input.femaleEmployees !== undefined) report.femaleEmployees = input.femaleEmployees;
    if (input.totalSalaryFund !== undefined) report.totalSalaryFund = input.totalSalaryFund;
    const stored = this.toStoredData(report);
    if (input.accidentTotals !== undefined) stored.accidentTotals = input.accidentTotals === null ? null : this.normalizeStats(input.accidentTotals);
    if (input.accidentDetails !== undefined) stored.accidentDetails = input.accidentDetails === null ? null : input.accidentDetails.map((item) => this.normalizeDetail(item));
    if (input.subsidizedAccident !== undefined) stored.subsidizedAccident = input.subsidizedAccident === null ? null : this.normalizeStats(input.subsidizedAccident);
    const reportData = { ...report, ...stored } as any;

    this.validateReportData(report);
    await this.validateDetailCategories(stored.accidentDetails);
    if (stampedReport) {
      this.validateStampedPdf(stampedReport);
      this.validateReportComplete(reportData);
      const stored = await this.storeStampedPdf(stampedReport);
      if (report.stampedReportUrl) await this.removeStampedPdf(report.stampedReportUrl);
      report.stampedReportUrl = stored.url;
      report.stampedReportFileId = randomUUID();
      report.stampedReportFileName = stampedReport.originalname;
      report.stampedReportContentType = stampedReport.mimetype;
      report.stampedReportSize = stampedReport.size;
      report.status = AccidentReportStatus.ACCEPTED;
    } else {
      report.status = AccidentReportStatus.IN_PROGRESS;
    }
    const saved = await this.reports.save(report);
    await this.persistNormalizedData(report.id, stored, input);
    const reloaded = await this.findReport(saved.id);
    return { message: stampedReport ? 'Gửi báo cáo thành công.' : 'Lưu tiến độ báo cáo thành công.', data: this.toDetail(reloaded) };
  }

  async getReportSummary(id: string, userId: string, role: string) {
    const report = await this.expireIfOverdue(await this.findReport(id));
    this.assertCanView(report, userId, role);
    const accident = this.normalizeStats(this.toStoredData(report).accidentTotals as any);
    const subsidizedAccident = this.normalizeStats(this.toStoredData(report).subsidizedAccident as any);
    const details = this.toStoredData(report).accidentDetails || [];
    const [injuryTypes, injuryFactors, occupations] = await Promise.all([
      this.groupDetails(details, 'injuryTypeId'), this.groupDetails(details, 'injuryFactorId'), this.groupDetails(details, 'occupationId'),
    ]);
    const grandTotal = this.sumStats([accident, subsidizedAccident]);
    return {
      message: 'Lấy tổng hợp báo cáo thành công.',
      data: {
        accident, injuryTypes, injuryFactors, occupations, subsidizedAccident, grandTotal,
        accidentDamage: this.sumDamage([accident, subsidizedAccident]),
      },
    };
  }

  async getOverallSummary(year?: number) {
    const resolvedYear = await this.resolveYear(year);
    const [acceptedReports, enterprises] = await Promise.all([
      this.reports.find({
        where: { year: resolvedYear, status: AccidentReportStatus.APPROVED },
        relations: ['enterprise', 'enterprise.businessType', 'stats', 'detailLinks', 'detailLinks.accidentDetail'],
        order: { createdAt: 'DESC' },
      }),
      this.enterprises.find({ relations: ['businessType'] }),
    ]);

    // A business may have both a six-month and a full-year report. Count only one:
    // prefer its accepted full-year report, otherwise use its accepted six-month report.
    const preferredByEnterprise = new Map<string, AccidentReport>();
    for (const report of acceptedReports) {
      const existing = preferredByEnterprise.get(report.enterpriseId);
      if (!existing || report.reportPeriod === AccidentReportPeriod.FULL_YEAR) preferredByEnterprise.set(report.enterpriseId, report);
    }
    const reports = Array.from(preferredByEnterprise.values());
    const byType = new Map<string, any>();
    for (const enterprise of enterprises) {
      const type = enterprise.businessType;
      if (!byType.has(type.id)) byType.set(type.id, {
        businessTypeId: type.id, name: type.name, code: type.code,
        totalBusinesses: 0, reportedBusinesses: 0, totalEmployees: 0,
        reportedEmployees: 0, femaleEmployees: 0, accidentFrequency: 0, fatalFrequency: 0,
        ...zeroStats(),
      });
      byType.get(type.id).totalBusinesses += 1;
    }
    const reportDetails: any[] = [];
    const total1: any = { ...zeroStats(), totalBusinesses: enterprises.length, reportedBusinesses: reports.length,
      totalEmployees: 0, reportedEmployees: 0, femaleEmployees: 0, accidentFrequency: 0, fatalFrequency: 0 };

    for (const report of reports) {
      const data = this.toStoredData(report);
      const typeStats = byType.get(report.enterprise.businessTypeId);
      const stats = this.normalizeStats(data.accidentTotals as any);
      Object.assign(typeStats, this.sumStats([typeStats, stats]));
      Object.assign(total1, this.sumStats([total1, stats]));
      const employees = numberValue(report.totalEmployees);
      const femaleEmployees = numberValue(report.femaleEmployees);
      typeStats.reportedBusinesses += 1;
      typeStats.reportedEmployees += employees;
      typeStats.totalEmployees += employees;
      typeStats.femaleEmployees += femaleEmployees;
      total1.reportedEmployees += employees;
      total1.totalEmployees += employees;
      total1.femaleEmployees += femaleEmployees;
      reportDetails.push(...(data.accidentDetails || []));
    }

    const frequency = (victims: number, employees: number) => employees ? victims * 1000 / employees : 0;
    for (const item of byType.values()) {
      item.accidentFrequency = frequency(item.totalVictims, item.reportedEmployees);
      item.fatalFrequency = frequency(item.totalFatalVictims, item.reportedEmployees);
    }
    total1.accidentFrequency = frequency(total1.totalVictims, total1.reportedEmployees);
    total1.fatalFrequency = frequency(total1.totalFatalVictims, total1.reportedEmployees);

    const [injuryTypes, injuryFactors, occupations] = await Promise.all([
      this.groupDetails(reportDetails, 'injuryTypeId'),
      this.groupDetails(reportDetails, 'injuryFactorId'),
      this.groupDetails(reportDetails, 'occupationId'),
    ]);
    return {
      message: 'Lấy báo cáo tổng hợp thành công.',
      data: {
        year: resolvedYear,
        businessTypes: Array.from(byType.values()),
        total1,
        injuryTypes, injuryFactors, occupations,
        total2: this.sumStats(reportDetails),
      },
    };
  }
  async reportWord(id: string) {
    const report = await this.findReport(id);
    const summary = (await this.getReportSummary(id, report.enterprise.userId, 'DOANH_NGHIEP')).data;
    const rows: Array<[string, any]> = [
      ['Doanh nghiệp', report.enterprise.name], ['Mã số thuế', report.enterprise.taxCode], ['Năm', report.year],
      ['Kỳ báo cáo', report.reportPeriod], ['Trạng thái', report.status],
      ['Tổng số lao động', report.totalEmployees], ['Lao động nữ', report.femaleEmployees], ['Tổng quỹ lương', report.totalSalaryFund],
      ['Số vụ tai nạn', (this.toStoredData(report).accidentTotals as any)?.totalCases], ['Số người bị nạn', (this.toStoredData(report).accidentTotals as any)?.totalVictims],
      ['Tổng chi phí', summary.accidentDamage.totalExpense],
    ];
    const categoryIds = (this.toStoredData(report).accidentDetails || []).reduce((ids: string[], item: any) => ids.concat([item.injuryTypeId, item.injuryFactorId, item.occupationId]), []);
    const categoryRows = categoryIds.length ? await this.categories.find({ where: { id: In(categoryIds) } }) : [];
    const categoryNames = new Map(categoryRows.map((item) => [item.id, item.name]));
    const detailRows = (this.toStoredData(report).accidentDetails || []).map((item: any, index) => `<tr><td>${index + 1}</td><td>${this.escapeHtml(categoryNames.get(item.injuryTypeId) || '')}</td><td>${this.escapeHtml(categoryNames.get(item.injuryFactorId) || '')}</td><td>${this.escapeHtml(categoryNames.get(item.occupationId) || '')}</td><td>${item.totalVictims || 0}</td><td>${item.totalFatalVictims || 0}</td><td>${item.totalSeverelyInjuredVictims || 0}</td></tr>`).join('');
    return this.wordDocument(`Báo cáo tai nạn lao động ${report.year}`, rows, `<h2>Chi tiết tai nạn</h2><table><tr><th>STT</th><th>Loại chấn thương</th><th>Yếu tố chấn thương</th><th>Nghề nghiệp</th><th>Người bị nạn</th><th>Tử vong</th><th>Bị thương nặng</th></tr>${detailRows}</table>`);
  }

  async overallSummaryWord(year?: number) {
    const result = await this.getOverallSummary(year);
    const { data } = result;
    const rows: Array<[string, any]> = [
      ['Năm', data.year], ['Tổng số vụ tai nạn', data.total1.totalCases], ['Tổng số người bị nạn', data.total1.totalVictims],
    ];
    const byType = data.businessTypes.map((item) => `<tr><td>${this.escapeHtml(item.name)}</td><td>${this.escapeHtml(item.code)}</td><td>${item.totalCases}</td><td>${item.totalVictims}</td></tr>`).join('');
    const categoryTable = (title: string, items: any[]) => `<h2>${title}</h2><table><tr><th>Danh mục</th><th>Mã</th><th>Người bị nạn</th><th>Tử vong</th><th>Bị thương nặng</th></tr>${items.map((item) => `<tr><td>${this.escapeHtml(item.name)}</td><td>${this.escapeHtml(item.code)}</td><td>${item.totalVictims}</td><td>${item.totalFatalVictims}</td><td>${item.totalSeverelyInjuredVictims}</td></tr>`).join('')}</table>`;
    return this.wordDocument(`Báo cáo tổng hợp tai nạn lao động ${data.year}`, rows,
      `<h2>Theo loại hình doanh nghiệp</h2><table><tr><th>Loại hình</th><th>Mã</th><th>Số vụ</th><th>Người bị nạn</th></tr>${byType}</table>${categoryTable('Theo loại chấn thương', data.injuryTypes)}${categoryTable('Theo yếu tố chấn thương', data.injuryFactors)}${categoryTable('Theo nghề nghiệp', data.occupations)}`);
  }

  private async resolveYear(year?: number) {
    if (year !== undefined) {
      await this.ensureReportsForYear(year);
      return year;
    }
    await this.ensureReportsForYear(new Date().getFullYear());
    const result = await this.reports.createQueryBuilder('report').select('MAX(report.year)', 'year').getRawOne();
    return Number(result && result.year) || new Date().getFullYear();
  }

  private baseListQuery() {
    return this.reports.createQueryBuilder('report')
      .leftJoinAndSelect('report.enterprise', 'enterprise')
      .leftJoinAndSelect('enterprise.user', 'user')
      .leftJoinAndSelect('enterprise.businessType', 'businessType')
      .leftJoinAndSelect('enterprise.businessIndustry', 'businessIndustry');
  }

  private applyFilters(builder: SelectQueryBuilder<AccidentReport>, query: ListAccidentReportsDto) {
    if (query.name) builder.andWhere('enterprise.name ILIKE :name', { name: `%${query.name}%` });
    if (query.taxCode) builder.andWhere('enterprise.taxCode ILIKE :taxCode', { taxCode: `%${query.taxCode}%` });
    if (query.reportPeriod) builder.andWhere('report.reportPeriod = :reportPeriod', { reportPeriod: query.reportPeriod });
    if (query.status) builder.andWhere('report.status = :status', { status: query.status });
    if (query.province) builder.andWhere('enterprise.province ILIKE :province', { province: `%${query.province}%` });
    if (query.ward) builder.andWhere('enterprise.ward ILIKE :ward', { ward: `%${query.ward}%` });
  }

  private async paginate(builder: SelectQueryBuilder<AccidentReport>, page = 1, size = 12) {
    const [reports, totalElements] = await builder.orderBy('enterprise.name', 'ASC').addOrderBy('report.reportPeriod', 'ASC')
      .skip((page - 1) * size).take(size).getManyAndCount();
    return {
      message: 'Lấy danh sách báo cáo tai nạn lao động thành công.',
      data: reports.map((report) => this.toListItem(report)),
      page, size, totalElements, totalPages: Math.ceil(totalElements / size),
    };
  }

  private async findReport(id: string) {
    const report = await this.reports.findOne({ where: { id }, relations: ['enterprise', 'enterprise.businessType', 'enterprise.businessIndustry', 'stats', 'detailLinks', 'detailLinks.accidentDetail'] });
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo tai nạn lao động.');
    return report;
  }

  private toStoredData(report: AccidentReport) {
    const stats = report.stats || [];
    const projectStats = (item?: AccidentStats) => {
      if (!item) return null;
      const output: any = zeroStats();
      Object.keys(output).forEach((key) => { output[key] = item[key]; });
      return this.normalizeStats(output);
    };
    return {
      accidentTotals: projectStats(stats.find((item) => !item.isSubsidizedAccident)),
      subsidizedAccident: projectStats(stats.find((item) => item.isSubsidizedAccident)),
      accidentDetails: (report.detailLinks || []).filter((link) => !!link.accidentDetail).map((link) => {
        const output: any = { accidentDetailId: link.accidentDetail.id };
        Object.keys(zeroStats()).forEach((key) => { output[key] = link.accidentDetail[key]; });
        ['injuryTypeId', 'injuryFactorId', 'occupationId'].forEach((key) => { output[key] = link.accidentDetail[key]; });
        return output;
      }),
    };
  }

  private async persistNormalizedData(reportId: string, data: any, input: UpdateAccidentReportDto) {
    for (const item of [{ value: input.accidentTotals, subsidized: false }, { value: input.subsidizedAccident, subsidized: true }]) {
      if (item.value === undefined) continue;
      await this.stats.delete({ accidentReportId: reportId, isSubsidizedAccident: item.subsidized });
      if (item.value !== null) await this.stats.save(this.stats.create({ ...this.normalizeStats(item.value), accidentReportId: reportId, isSubsidizedAccident: item.subsidized }));
    }
    if (input.accidentDetails !== undefined) {
      const links = await this.detailLinks.find({ where: { accidentReportId: reportId } });
      const ids = links.map((link) => link.accidentDetailId);
      if (links.length) await this.detailLinks.remove(links);
      if (ids.length) await this.details.delete(ids);
      if (input.accidentDetails) for (const item of data.accidentDetails) {
        const detail = await this.details.save(this.details.create(item as any) as unknown as AccidentDetail);
        await this.detailLinks.save(this.detailLinks.create({ accidentReportId: reportId, accidentDetailId: detail.id }));
      }
    }
  }
  private assertCanView(report: AccidentReport, userId: string, role: string) {
    if (role === 'SO') return;
    if (role !== 'DOANH_NGHIEP' || report.enterprise.userId !== userId) throw new ForbiddenException('Bạn không có quyền xem báo cáo này.');
  }

  private toListItem(report: AccidentReport) {
    return {
      accidentReportId: report.id, enterpriseId: report.enterpriseId, name: report.enterprise.name,
      taxCode: report.enterprise.taxCode, reportPeriod: report.reportPeriod, status: report.status,
      year: report.year, note: report.note || '', createdAt: report.createdAt, updatedAt: report.updatedAt,
    };
  }

  private toDetail(report: AccidentReport): AccidentReportDetailResponse {
    return {
      accidentReportId: report.id, enterpriseId: report.enterpriseId, year: report.year,
      reportPeriod: report.reportPeriod, status: report.status, note: report.note || '', companyName: report.enterprise.name,
      taxCode: report.enterprise.taxCode, businessTypeName: report.enterprise.businessType.name,
      businessIndustryName: report.enterprise.businessIndustry.name, totalEmployees: report.totalEmployees,
      femaleEmployees: report.femaleEmployees, totalSalaryFund: report.totalSalaryFund,
      accidentTotals: this.toStoredData(report).accidentTotals,
      accidentDetails: this.toStoredData(report).accidentDetails as unknown as AccidentDetailDto[] | null,
      subsidizedAccident: this.toStoredData(report).subsidizedAccident,
      stampedReport: report.stampedReportUrl ? {
        fileId: report.stampedReportFileId,
        fileName: report.stampedReportFileName, contentType: report.stampedReportContentType,
        size: report.stampedReportSize, url: report.stampedReportUrl,
      } : null,
      createdAt: report.createdAt, updatedAt: report.updatedAt,
    };
  }

  private normalizeStats(input: any) {
    const output = { ...zeroStats(), ...(input || {}) };
    output.totalExpense = numberValue(output.medicalExpense) + numberValue(output.salaryExpenseDuringTreatment) + numberValue(output.compensationExpense);
    return output;
  }

  private normalizeDetail(input: AccidentDetailDto) {
    const output: any = { ...input };
    output.totalExpense = numberValue(output.medicalExpense) + numberValue(output.salaryExpenseDuringTreatment) + numberValue(output.compensationExpense);
    return output;
  }

  private validateReportData(report: AccidentReport) {
    if (report.totalEmployees !== null && report.femaleEmployees !== null && report.femaleEmployees > report.totalEmployees) {
      throw new BadRequestException('Số lao động nữ không được vượt quá tổng số lao động.');
    }
    this.validateStats((report as any).accidentTotals, 'Tai nạn lao động');
    this.validateStats((report as any).subsidizedAccident, 'Tai nạn được hưởng trợ cấp');
    for (const item of this.toStoredData(report).accidentDetails || []) this.validateStats(item as any, 'Chi tiết tai nạn');
  }

  private validateStats(stats: any, label: string) {
    if (!stats) return;
    const value = (field: string) => numberValue(stats[field]);
    if (value('fatalCases') > value('totalCases') || value('totalCasesWithTwoOrMoreVictims') > value('totalCases')) {
      throw new BadRequestException(`${label}: số vụ có người chết hoặc từ hai người bị nạn không được vượt quá tổng số vụ.`);
    }
    const victims = value('totalVictims');
    const victimBreakdown = value('totalFemaleVictims') + value('totalFatalVictims') + value('totalSeverelyInjuredVictims');
    if (victimBreakdown > victims) throw new BadRequestException(`${label}: tổng lao động nữ, người chết và người bị thương nặng không được vượt quá tổng số người bị nạn.`);
    const nonManaged = value('nonManagedVictims');
    const nonManagedBreakdown = value('nonManagedFemaleVictims') + value('nonManagedFatalVictims') + value('nonManagedSeverelyInjuredVictims');
    if (nonManaged > victims || nonManagedBreakdown > nonManaged ||
      value('nonManagedFemaleVictims') > value('totalFemaleVictims') ||
      value('nonManagedFatalVictims') > value('totalFatalVictims') ||
      value('nonManagedSeverelyInjuredVictims') > value('totalSeverelyInjuredVictims')) {
      throw new BadRequestException(`${label}: các số liệu người lao động không thuộc quyền quản lý không hợp lệ.`);
    }
  }

  private validateReportComplete(report: AccidentReport) {
    if (report.totalEmployees === null || report.femaleEmployees === null || report.totalSalaryFund === null ||
      !(report as any).accidentTotals || (report as any).accidentDetails === null) {
      throw new BadRequestException('Vui lòng hoàn tất thông tin doanh nghiệp và số liệu tai nạn trước khi gửi báo cáo.');
    }
  }

  private async validateDetailCategories(details: Record<string, unknown>[] | null) {
    if (!details?.length) return;
    const ids = details.reduce((result: string[], item: any) => result.concat([item.injuryTypeId, item.injuryFactorId, item.occupationId]), []);
    const categories = await this.categories.find({ where: { id: In(ids), isActive: true } });
    const byId = new Map(categories.map((item) => [item.id, item.type]));
    for (const item of details as any[]) {
      if (byId.get(item.injuryTypeId) !== AccidentCategoryType.INJURY_TYPE ||
        byId.get(item.injuryFactorId) !== AccidentCategoryType.INJURY_FACTOR ||
        byId.get(item.occupationId) !== AccidentCategoryType.OCCUPATION) {
        throw new BadRequestException('Danh mục trong chi tiết tai nạn không tồn tại, không hoạt động hoặc không đúng loại.');
      }
    }
  }

  private sumStats(items: any[]) {
    const result: any = zeroStats();
    for (const item of items) for (const field of victimFields) result[field] += numberValue(item && item[field]);
    for (const item of items) for (const field of expenseFields) result[field] += numberValue(item && item[field]);
    result.totalExpense = result.medicalExpense + result.salaryExpenseDuringTreatment + result.compensationExpense;
    return result;
  }

  private async groupDetails(details: any[], key: 'injuryTypeId' | 'injuryFactorId' | 'occupationId') {
    const ids = Array.from(new Set(details.map((item) => item[key]).filter(Boolean)));
    const categories = ids.length ? await this.categories.find({ where: { id: In(ids) } }) : [];
    const byId = new Map(categories.map((category) => [category.id, category]));
    const groups = new Map<string, any>();
    for (const detail of details) {
      const id = detail[key];
      if (!id) continue;
      if (!groups.has(id)) {
        const category = byId.get(id);
        groups.set(id, { categoryId: id, code: category?.code || '', name: category?.name || '', ...zeroStats() });
      }
      const group = groups.get(id);
      for (const field of victimFields) group[field] += numberValue(detail[field]);
      for (const field of expenseFields) group[field] += numberValue(detail[field]);
      group.totalExpense = group.medicalExpense + group.salaryExpenseDuringTreatment + group.compensationExpense;
    }
    return Array.from(groups.values());
  }

  private sumDamage(items: any[]) {
    const result = { totalDaysOff: 0, medicalExpense: 0, salaryExpenseDuringTreatment: 0, compensationExpense: 0, totalExpense: 0, propertyDamageExpense: 0 };
    for (const item of items) {
      result.totalDaysOff += numberValue(item.totalDaysOff);
      result.medicalExpense += numberValue(item.medicalExpense);
      result.salaryExpenseDuringTreatment += numberValue(item.salaryExpenseDuringTreatment);
      result.compensationExpense += numberValue(item.compensationExpense);
      result.propertyDamageExpense += numberValue(item.propertyDamageExpense);
    }
    result.totalExpense = result.medicalExpense + result.salaryExpenseDuringTreatment + result.compensationExpense;
    return result;
  }

  private validateStampedPdf(file: ReportPdfFile) {
    if (file.mimetype !== 'application/pdf' || extname(file.originalname).toLowerCase() !== '.pdf') {
      throw new BadRequestException('Tệp báo cáo đính kèm phải có định dạng PDF.');
    }
  }

  private async storeStampedPdf(file: ReportPdfFile) {
    const directory = join(process.cwd(), 'uploads', 'accident-reports');
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}.pdf`;
    await writeFile(join(directory, filename), file.buffer);
    return { url: `/uploads/accident-reports/${filename}` };
  }

  private async removeStampedPdf(url: string) {
    const filename = url.split('/').pop();
    if (!filename || filename.includes('..')) return;
    try { await unlink(join(process.cwd(), 'uploads', 'accident-reports', filename)); } catch (_error) { /* old file may already be absent */ }
  }

  private wordDocument(title: string, rows: Array<[string, any]>, extraHtml = '') {
    const body = rows.map(([label, value]) => `<tr><th>${this.escapeHtml(label)}</th><td>${this.escapeHtml(value == null ? '' : String(value))}</td></tr>`).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial}table{border-collapse:collapse;width:100%;margin:12px 0}td,th{border:1px solid #555;padding:6px;text-align:left}h1{text-align:center}</style></head><body><h1>${this.escapeHtml(title)}</h1><table>${body}</table>${extraHtml}</body></html>`;
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] as string));
  }
}
