import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '../role/role.entity';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { BusinessIndustry, BusinessType } from './enterprise-reference.entity';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { DeleteEnterprisesDto } from './dto/delete-enterprises.dto';
import { ListEnterprisesQueryDto } from './dto/list-enterprises-query.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { Enterprise } from './enterprise.entity';
import { EnterpriseFile, StoredEnterpriseFile, storeEnterpriseFile } from './enterprise-upload';
import { PageResponseDto } from '../../commons/dto/page-response.dto';
import { EnterpriseResponseDto } from './dto/enterprise-response.dto';
import { EnterpriseDetailResponseDto } from './dto/enterprise-detail-response.dto';

@Injectable()
export class EnterpriseService {
  constructor(
    @InjectRepository(Enterprise) private readonly enterprises: Repository<Enterprise>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(BusinessType) private readonly businessTypes: Repository<BusinessType>,
    @InjectRepository(BusinessIndustry) private readonly industries: Repository<BusinessIndustry>,
    private readonly users: UserService,
  ) {}

  async list(query: ListEnterprisesQueryDto): Promise<PageResponseDto<EnterpriseResponseDto>> {
    const { name, taxCode, businessType, businessIndustry, ward, isActive, page, size } = query;
    const builder = this.enterprises.createQueryBuilder('enterprise')
      .leftJoinAndSelect('enterprise.user', 'user')
      .leftJoinAndSelect('enterprise.businessType', 'businessType')
      .leftJoinAndSelect('enterprise.businessIndustry', 'businessIndustry')
      .orderBy('enterprise.name', 'ASC')
      .skip((page - 1) * size)
      .take(size);
    if (name) builder.andWhere('enterprise.name ILIKE :name', { name: `%${name}%` });
    if (taxCode) builder.andWhere('enterprise.taxCode ILIKE :taxCode', { taxCode: `%${taxCode}%` });
    if (businessType) builder.andWhere('businessType.name ILIKE :businessType', { businessType: `%${businessType}%` });
    if (businessIndustry) builder.andWhere('businessIndustry.name ILIKE :businessIndustry', { businessIndustry: `%${businessIndustry}%` });
    if (ward) builder.andWhere('enterprise.ward ILIKE :ward', { ward: `%${ward}%` });
    if (isActive !== undefined) builder.andWhere('user.isActive = :isActive', { isActive });
    const [records, totalElements] = await builder.getManyAndCount();
    return {
      message: 'Lấy danh sách doanh nghiệp thành công.',
      data: records.map((record) => this.toResponse(record)),
      page, size, totalElements, totalPages: Math.ceil(totalElements / size),
    };
  }

  async get(id: string): Promise<{ message: string; data: EnterpriseDetailResponseDto }> {
    const record = await this.enterprises.findOne({ where: { id }, relations: ['user', 'businessType', 'businessIndustry'] });
    if (!record) throw new NotFoundException('Không tìm thấy doanh nghiệp.');
    return { message: 'Lấy thông tin chi tiết doanh nghiệp thành công.', data: await this.toDetailResponse(record) };
  }

  async create(input: CreateEnterpriseDto, businessLicense?: EnterpriseFile, otherDocument?: EnterpriseFile) {
    const taxCode = input.taxCode.trim();
    if (await this.enterprises.findOne({ where: { taxCode } })) throw new ConflictException('Mã số thuế đã được đăng ký.');
    const role = await this.roles.findOne({ where: { role: 'DOANH_NGHIEP' } });
    if (!role) throw new NotFoundException('Chưa có dữ liệu vai trò doanh nghiệp.');
    const businessType = await this.businessTypes.findOne({ where: { id: input.businessTypeId, isActive: true } });
    if (!businessType) throw new NotFoundException('Không tìm thấy loại hình kinh doanh đang hoạt động.');
    const businessIndustry = await this.industries.findOne({ where: { id: input.businessIndustryId, level: 4 } });
    if (!businessIndustry) throw new NotFoundException('Không tìm thấy ngành nghề kinh doanh cấp 4.');

    const created = await this.users.createUser({
      username: taxCode, fullname: input.name, password: '12345678', roleId: role.id,
      email: input.email, isActive: true,
    } as CreateUserDto);
    const user = await this.users.findByUsername(taxCode);
    if (!user) throw new NotFoundException('Không thể tạo tài khoản doanh nghiệp.');
    const storedBusinessLicense = businessLicense ? await storeEnterpriseFile(businessLicense) : null;
    const storedOtherDocument = otherDocument ? await storeEnterpriseFile(otherDocument) : null;
    const record = this.enterprises.create({
      userId: user.id, user, taxCode, name: input.name, email: input.email,
      licenseIssueDate: input.licenseIssueDate ?? null,
      businessTypeId: businessType.id, businessType,
      businessIndustryId: businessIndustry.id, businessIndustry,
      province: input.province, ward: input.ward, address: input.address ?? null,
      foreignName: input.foreignName ?? null, officePhone: input.officePhone ?? null,
      operatingProvince: input.operatingProvince ?? null, operatingWard: input.operatingWard ?? null,
      businessLocation: input.businessLocation ?? null, representative: input.representative ?? null,
      representativePhone: input.representativePhone ?? null,
      businessLicenseUrl: storedBusinessLicense?.url ?? null,
      businessLicenseFileId: storedBusinessLicense?.fileId ?? null,
      businessLicenseFileName: storedBusinessLicense?.fileName ?? null,
      businessLicenseContentType: storedBusinessLicense?.contentType ?? null,
      businessLicenseSize: storedBusinessLicense?.size ?? null,
      otherDocumentUrl: storedOtherDocument?.url ?? null,
      otherDocumentFileId: storedOtherDocument?.fileId ?? null,
      otherDocumentFileName: storedOtherDocument?.fileName ?? null,
      otherDocumentContentType: storedOtherDocument?.contentType ?? null,
      otherDocumentSize: storedOtherDocument?.size ?? null,
    });
    await this.enterprises.save(record);
    return { message: 'Tạo doanh nghiệp thành công.', data: { ...created.data, enterpriseId: record.id } };
  }

  async update(id: string, input: UpdateEnterpriseDto, businessLicense?: EnterpriseFile, otherDocument?: EnterpriseFile) {
    const record = await this.enterprises.findOne({ where: { id }, relations: ['user', 'businessType', 'businessIndustry'] });
    if (!record) throw new NotFoundException('Không tìm thấy doanh nghiệp.');
    const businessType = await this.businessTypes.findOne({ where: { id: input.businessTypeId, isActive: true } });
    if (!businessType) throw new NotFoundException('Không tìm thấy loại hình kinh doanh đang hoạt động.');
    const businessIndustry = await this.industries.findOne({ where: { id: input.businessIndustryId, level: 4 } });
    if (!businessIndustry) throw new NotFoundException('Không tìm thấy ngành nghề kinh doanh cấp 4.');
    const existingEmail = await this.users.findByEmail(input.email);
    if (existingEmail && existingEmail.id !== record.userId) throw new ConflictException('Email đã được sử dụng.');

    Object.assign(record, {
      name: input.name, email: input.email, licenseIssueDate: input.licenseIssueDate ?? null,
      businessTypeId: businessType.id, businessType,
      businessIndustryId: businessIndustry.id, businessIndustry,
      province: input.province, ward: input.ward, address: input.address ?? null,
      foreignName: input.foreignName ?? null, officePhone: input.officePhone ?? null,
      operatingProvince: input.operatingProvince ?? null, operatingWard: input.operatingWard ?? null,
      businessLocation: input.businessLocation ?? null, representative: input.representative ?? null,
      representativePhone: input.representativePhone ?? null,
    });
    if (businessLicense) this.setStoredFile(record, 'businessLicense', await storeEnterpriseFile(businessLicense));
    if (otherDocument) this.setStoredFile(record, 'otherDocument', await storeEnterpriseFile(otherDocument));
    record.user.fullname = input.name;
    record.user.email = input.email;
    await this.users.save(record.user);
    await this.enterprises.save(record);
    return { message: 'Cập nhật doanh nghiệp thành công.', data: this.toResponse(record) };
  }

  async deleteMany(input: DeleteEnterprisesDto) {
    const records = await this.enterprises.find({ where: { id: In(input.enterpriseIds) } });
    const result = await this.users.deleteUsers(records.map((record) => record.userId));
    return { message: 'Xóa doanh nghiệp thành công.', data: { deletedCount: result.data.deletedCount } };
  }

  private toResponse(record: Enterprise) {
    return {
      enterpriseId: record.id, userId: record.userId, name: record.name, taxCode: record.taxCode,
      businessType: record.businessType?.name || '',
      businessIndustry: record.businessIndustry?.name || '', ward: record.ward,
      isActive: record.user?.isActive ?? false,
    };
  }

  private async toDetailResponse(record: Enterprise): Promise<EnterpriseDetailResponseDto> {
    return {
      name: record.name,
      taxCode: record.taxCode,
      licenseIssueDate: record.licenseIssueDate,
      businessTypeId: record.businessTypeId,
      businessIndustryId: record.businessIndustryId,
      province: record.province,
      ward: record.ward,
      address: record.address,
      foreignName: record.foreignName,
      email: record.email,
      officePhone: record.officePhone,
      operatingProvince: record.operatingProvince,
      operatingWard: record.operatingWard,
      businessLocation: record.businessLocation,
      representative: record.representative,
      representativePhone: record.representativePhone,
      businessLicense: await this.toFileResponse(record, 'businessLicense'),
      otherDocument: await this.toFileResponse(record, 'otherDocument'),
    };
  }

  private setStoredFile(record: Enterprise, field: 'businessLicense' | 'otherDocument', file: StoredEnterpriseFile) {
    if (field === 'businessLicense') {
      record.businessLicenseUrl = file.url;
      record.businessLicenseFileId = file.fileId;
      record.businessLicenseFileName = file.fileName;
      record.businessLicenseContentType = file.contentType;
      record.businessLicenseSize = file.size;
      return;
    }
    record.otherDocumentUrl = file.url;
    record.otherDocumentFileId = file.fileId;
    record.otherDocumentFileName = file.fileName;
    record.otherDocumentContentType = file.contentType;
    record.otherDocumentSize = file.size;
  }

  private async toFileResponse(record: Enterprise, field: 'businessLicense' | 'otherDocument') {
    const metadata = field === 'businessLicense'
      ? {
          url: record.businessLicenseUrl,
          fileId: record.businessLicenseFileId,
          fileName: record.businessLicenseFileName,
          contentType: record.businessLicenseContentType,
          size: record.businessLicenseSize,
        }
      : {
          url: record.otherDocumentUrl,
          fileId: record.otherDocumentFileId,
          fileName: record.otherDocumentFileName,
          contentType: record.otherDocumentContentType,
          size: record.otherDocumentSize,
        };
    const url = metadata.url;
    if (!url) return null;

    const fileName = metadata.fileName || url.split('/').pop() || 'file';
    let size = metadata.size ?? 0;
    if (metadata.size == null) {
      const { stat } = await import('fs/promises');
      const { join } = await import('path');
      try {
        size = (await stat(join(process.cwd(), 'uploads', 'enterprises', url.split('/').pop() || ''))).size;
      } catch {
        size = 0;
      }
    }
    const extension = fileName.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', pdf: 'application/pdf',
      doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const fileId = metadata.fileId || (url.split('/').pop() || '').replace(/\.[^.]+$/, '');
    return {
      fileId,
      fileName,
      contentType: metadata.contentType || contentTypes[extension || ''] || 'application/octet-stream',
      size,
      url,
    };
  }
}
