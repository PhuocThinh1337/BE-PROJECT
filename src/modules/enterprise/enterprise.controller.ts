import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Put, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { DeleteEnterprisesDto } from './dto/delete-enterprises.dto';
import { ListEnterprisesQueryDto } from './dto/list-enterprises-query.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { EnterpriseFile, enterpriseFileFilter } from './enterprise-upload';
import { EnterpriseService } from './enterprise.service';

@ApiTags('Enterprises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('enterprises')
export class EnterpriseController {
  constructor(private readonly service: EnterpriseService) {}

  @Get()
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'taxCode', required: false })
  @ApiQuery({ name: 'businessType', required: false })
  @ApiQuery({ name: 'businessIndustry', required: false })
  @ApiQuery({ name: 'ward', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiOperation({ summary: 'Get a filtered, paginated enterprise list' })
  list(@Query() query: ListEnterprisesQueryDto, @Req() request: any) {
    this.assertSo(request.user.role);
    return this.service.list(query);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete one or more enterprises and their accounts' })
  deleteMany(@Body() body: DeleteEnterprisesDto, @Req() request: any) {
    this.assertSo(request.user.role);
    return this.service.deleteMany(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enterprise details' })
  get(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: any) {
    this.assertSo(request.user.role);
    return this.service.get(id);
  }

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'businessLicense', maxCount: 1 },
    { name: 'otherDocument', maxCount: 1 },
  ], { limits: { fileSize: 5 * 1024 * 1024, files: 2 }, fileFilter: enterpriseFileFilter as any }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['taxcode', 'name', 'businessTypeId', 'businessIndustryId', 'province', 'ward', 'email'], properties: {
    name: { type: 'string' }, licenseIssueDate: { type: 'string', format: 'date', nullable: true },
    taxcode: { type: 'string', pattern: '^\\d{10}$' },
    businessTypeId: { type: 'string', format: 'uuid' }, businessIndustryId: { type: 'string', format: 'uuid' },
    province: { type: 'string' }, ward: { type: 'string' }, address: { type: 'string', nullable: true },
    foreignName: { type: 'string', nullable: true }, email: { type: 'string', format: 'email' },
    officePhone: { type: 'string', nullable: true }, operatingProvince: { type: 'string', nullable: true },
    operatingWard: { type: 'string', nullable: true }, businessLocation: { type: 'string', nullable: true },
    representative: { type: 'string', nullable: true }, representativePhone: { type: 'string', nullable: true },
    businessLicense: { type: 'string', format: 'binary' }, otherDocument: { type: 'string', format: 'binary' },
  } } })
  @ApiOperation({ summary: 'Create enterprise and its tax-code login account' })
  create(@Body() body: CreateEnterpriseDto, @UploadedFiles() files: { businessLicense?: EnterpriseFile[]; otherDocument?: EnterpriseFile[] }, @Req() request: any) {
    this.assertSo(request.user.role);
    return this.service.create(body, files?.businessLicense?.[0], files?.otherDocument?.[0]);
  }

  @Put(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'businessLicense', maxCount: 1 },
    { name: 'otherDocument', maxCount: 1 },
  ], { limits: { fileSize: 5 * 1024 * 1024, files: 2 }, fileFilter: enterpriseFileFilter as any }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['name', 'businessTypeId', 'businessIndustryId', 'province', 'ward', 'email'], properties: {
    name: { type: 'string' }, licenseIssueDate: { type: 'string', format: 'date', nullable: true },
    businessTypeId: { type: 'string', format: 'uuid' }, businessIndustryId: { type: 'string', format: 'uuid' },
    province: { type: 'string' }, ward: { type: 'string' }, address: { type: 'string', nullable: true },
    foreignName: { type: 'string', nullable: true }, email: { type: 'string', format: 'email' },
    officePhone: { type: 'string', nullable: true }, operatingProvince: { type: 'string', nullable: true },
    operatingWard: { type: 'string', nullable: true }, businessLocation: { type: 'string', nullable: true },
    representative: { type: 'string', nullable: true }, representativePhone: { type: 'string', nullable: true },
    businessLicense: { type: 'string', format: 'binary' }, otherDocument: { type: 'string', format: 'binary' },
  } } })
  @ApiOperation({ summary: 'Update enterprise and its documents' })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateEnterpriseDto, @UploadedFiles() files: { businessLicense?: EnterpriseFile[]; otherDocument?: EnterpriseFile[] }, @Req() request: any) {
    this.assertSo(request.user.role);
    return this.service.update(id, body, files?.businessLicense?.[0], files?.otherDocument?.[0]);
  }

  private assertSo(role: string) {
    if (role !== 'SO') throw new ForbiddenException('Only SO users can manage enterprises.');
  }
}
