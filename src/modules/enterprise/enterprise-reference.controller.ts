import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { BusinessIndustry, BusinessType } from './enterprise-reference.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Dữ liệu tham chiếu doanh nghiệp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class EnterpriseReferenceController {
  constructor(
    @InjectRepository(BusinessType) private readonly businessTypes: Repository<BusinessType>,
    @InjectRepository(BusinessIndustry) private readonly industries: Repository<BusinessIndustry>,
  ) {}

  @Get('business-types')
  async listBusinessTypes() {
    const records = await this.businessTypes.find({ where: { isActive: true }, order: { name: 'ASC' } });
    return { message: 'Lấy danh sách loại hình kinh doanh thành công.', data: records.map(({ id, code, name }) => ({ businessTypeId: id, code, name })) };
  }

  @Get('business-industries')
  async listBusinessIndustries() {
    const records = await this.industries.find({ where: { level: 4 }, order: { name: 'ASC' } });
    return { message: 'Lấy danh sách ngành nghề kinh doanh thành công.', data: records.map(({ id, code, name }) => ({ businessIndustryId: id, code, name })) };
  }
}
