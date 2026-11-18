import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccidentCategoryType } from './accident-category.entity';
import { AccidentReportService } from './accident-report.service';
import { ListAccidentCategoriesDto, ListAccidentReportsDto, ReviewAccidentReportsDto, UpdateAccidentReportDto } from './dto/accident-report.dto';
import { AccidentReportPeriod } from './accident-report.entity';
import { CreateAccidentCategoryDto, UpdateAccidentCategoryDto, UpdateReportPeriodConfigDto } from './dto/report-configuration.dto';

interface ReportPdfFile { originalname: string; mimetype: string; size: number; buffer: Buffer; }

@ApiTags('Báo cáo tai nạn lao động')
@Controller()
export class AccidentReportController {
  constructor(private readonly service: AccidentReportService) {}

  @Get('report-configs/years')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách năm đã có cấu hình báo cáo' })
  reportConfigYears(@Req() request: any) {
    if (!['SO', 'DOANH_NGHIEP'].includes(request.user.role)) throw new ForbiddenException();
    return this.service.listReportConfigYears();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh mục loại chấn thương, yếu tố chấn thương hoặc nghề nghiệp' })
  categories(@Query() query: ListAccidentCategoriesDto) {
    return this.service.getCategories(query.type);
  }

  @Get('report-configurations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy cấu hình kỳ, hạn nộp và trường bắt buộc của báo cáo' })
  reportConfigurations(@Req() request: any) {
    if (!['SO', 'DOANH_NGHIEP'].includes(request.user.role)) throw new ForbiddenException();
    return this.service.listPeriodConfigs();
  }

  @Put('report-configurations/:period')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sở cập nhật cấu hình kỳ báo cáo' })
  updateReportConfiguration(@Req() request: any, @Param('period') period: AccidentReportPeriod, @Body() body: UpdateReportPeriodConfigDto) {
    this.assertSo(request.user.role);
    if (!Object.values(AccidentReportPeriod).includes(period)) throw new BadRequestException('Kỳ báo cáo không hợp lệ.');
    return this.service.updatePeriodConfig(period, body);
  }

  @Post('categories/:type')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sở thêm một mục danh mục báo cáo' })
  createCategory(@Req() request: any, @Param('type') type: AccidentCategoryType, @Body() body: CreateAccidentCategoryDto) {
    this.assertSo(request.user.role);
    if (!Object.values(AccidentCategoryType).includes(type)) throw new BadRequestException('Nhóm danh mục không hợp lệ.');
    return this.service.createCategory(type, body);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sở cập nhật hoặc ngừng sử dụng một mục danh mục báo cáo' })
  updateCategory(@Req() request: any, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateAccidentCategoryDto) {
    this.assertSo(request.user.role);
    return this.service.updateCategory(id, body);
  }

  @Get('accident-reports/summary/export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xuất báo cáo tổng hợp toàn Sở ra Word' })
  async exportOverall(@Req() request: any, @Query('year') year: string, @Res() response: Response) {
    this.assertSo(request.user.role);
    const parsedYear = this.parseYear(year);
    const document = await this.service.overallSummaryWord(parsedYear);
    response.setHeader('Content-Type', 'application/msword; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="accident-report-summary-${parsedYear || new Date().getFullYear()}.doc"`);
    response.send(Buffer.from(document, 'utf8'));
  }

  @Get('accident-reports/summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy báo cáo tổng hợp toàn Sở theo năm, chỉ tính báo cáo đã tiếp nhận' })
  overallSummary(@Req() request: any, @Query('year') year: string) {
    this.assertSo(request.user.role);
    return this.service.getOverallSummary(this.parseYear(year));
  }

  @Get('accident-reports/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Doanh nghiệp lấy danh sách báo cáo của tài khoản đang đăng nhập' })
  listMine(@Req() request: any, @Query() query: ListAccidentReportsDto) {
    this.assertEnterprise(request.user.role);
    return this.service.listForEnterprise(request.user.id, query);
  }

  @Get('accident-reports')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sở lấy danh sách báo cáo tai nạn lao động của các doanh nghiệp' })
  list(@Req() request: any, @Query() query: ListAccidentReportsDto) {
    this.assertSo(request.user.role);
    return this.service.listForDepartment(query);
  }

  @Get('accident-reports/:id/export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xuất báo cáo tai nạn lao động ra Word' })
  async exportReport(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: any, @Res() response: Response) {
    this.assertSo(request.user.role);
    const document = await this.service.reportWord(id);
    response.setHeader('Content-Type', 'application/msword; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="accident-report-${id}.doc"`);
    response.send(Buffer.from(document, 'utf8'));
  }

  @Get('accident-reports/:id/summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy số liệu tổng hợp của một báo cáo' })
  reportSummary(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: any) {
    return this.service.getReportSummary(id, request.user.id, request.user.role);
  }

  @Get('accident-reports/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy chi tiết báo cáo; doanh nghiệp chỉ xem báo cáo của mình' })
  detail(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: any) {
    return this.service.getReport(id, request.user.id, request.user.role);
  }

  @Put('accident-reports/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sở duyệt hoặc từ chối các báo cáo đã nộp' })
  review(@Req() request: any, @Body() body: ReviewAccidentReportsDto) {
    this.assertSo(request.user.role);
    return this.service.reviewReports(body, request.user.id);
  }

  @Put('accident-reports/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('stampedReport', {
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      if (file.mimetype !== 'application/pdf' || extname(file.originalname).toLowerCase() !== '.pdf') {
        callback(new BadRequestException('Tệp báo cáo đính kèm phải có định dạng PDF.'), false);
        return;
      }
      callback(null, true);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cập nhật tiến độ hoặc gửi báo cáo tai nạn lao động kèm PDF' })
  @ApiBody({ schema: { type: 'object', properties: {
    totalEmployees: { type: 'number' }, femaleEmployees: { type: 'number' }, totalSalaryFund: { type: 'number' },
    accidentTotals: { type: 'string', description: 'JSON AccidentStats' }, accidentDetails: { type: 'string', description: 'JSON AccidentDetail[]' },
    subsidizedAccident: { type: 'string', description: 'JSON AccidentStats' }, stampedReport: { type: 'string', format: 'binary', description: 'PDF; đính kèm để gửi và tiếp nhận báo cáo' },
  } } })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: any, @Body() body: UpdateAccidentReportDto, @UploadedFile() file?: ReportPdfFile) {
    return this.service.updateReport(id, request.user.id, request.user.role, body, file);
  }

  private assertSo(role: string) {
    if (role !== 'SO') throw new ForbiddenException('Chỉ tài khoản Sở mới được sử dụng chức năng này.');
  }

  private assertEnterprise(role: string) {
    if (role !== 'DOANH_NGHIEP') throw new ForbiddenException('Chỉ tài khoản doanh nghiệp mới được sử dụng chức năng này.');
  }

  private parseYear(value?: string): number | undefined {
    if (value === undefined) return undefined;
    const year = Number(value);
    if (!Number.isInteger(year) || year < 2000 || year > new Date().getFullYear() + 20) throw new BadRequestException('Năm báo cáo không hợp lệ.');
    return year;
  }
}
