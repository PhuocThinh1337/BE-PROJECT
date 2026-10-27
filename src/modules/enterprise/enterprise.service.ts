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
import { EnterpriseFile, storeEnterpriseFile } from './enterprise-upload';
import { PageResponseDto } from '../../commons/dto/page-response.dto';
import { EnterpriseResponseDto } from './dto/enterprise-response.dto';

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
      message: 'Get enterprise list successfully',
      data: records.map((record) => this.toResponse(record)),
      page, size, totalElements, totalPages: Math.ceil(totalElements / size),
    };
  }

  async get(id: string) {
    const record = await this.enterprises.findOne({ where: { id }, relations: ['user', 'businessType', 'businessIndustry'] });
    if (!record) throw new NotFoundException('Enterprise not found.');
    return { message: 'Enterprise details retrieved successfully', data: this.toResponse(record) };
  }

  async create(input: CreateEnterpriseDto, businessLicense?: EnterpriseFile, otherDocument?: EnterpriseFile) {
    const taxCode = input.taxCode.trim();
    if (await this.enterprises.findOne({ where: { taxCode } })) throw new ConflictException('Tax code is already registered.');
    const role = await this.roles.findOne({ where: { role: 'DOANH_NGHIEP' } });
    if (!role) throw new NotFoundException('Enterprise role has not been seeded.');
    const businessType = await this.businessTypes.findOne({ where: { id: input.businessTypeId, isActive: true } });
    if (!businessType) throw new NotFoundException('Active business type not found.');
    const businessIndustry = await this.industries.findOne({ where: { id: input.businessIndustryId, level: 4 } });
    if (!businessIndustry) throw new NotFoundException('Level 4 business industry not found.');

    const created = await this.users.createUser({
      username: taxCode, fullname: input.name, password: '12345678', roleId: role.id,
      email: input.email, isActive: true,
    } as CreateUserDto);
    const user = await this.users.findByUsername(taxCode);
    if (!user) throw new NotFoundException('Could not create enterprise account.');
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
      businessLicenseUrl: businessLicense ? await storeEnterpriseFile(businessLicense) : null,
      otherDocumentUrl: otherDocument ? await storeEnterpriseFile(otherDocument) : null,
    });
    await this.enterprises.save(record);
    return { message: 'Enterprise created successfully', data: { ...created.data, enterpriseId: record.id } };
  }

  async update(id: string, input: UpdateEnterpriseDto, businessLicense?: EnterpriseFile, otherDocument?: EnterpriseFile) {
    const record = await this.enterprises.findOne({ where: { id }, relations: ['user', 'businessType', 'businessIndustry'] });
    if (!record) throw new NotFoundException('Enterprise not found.');
    const businessType = await this.businessTypes.findOne({ where: { id: input.businessTypeId, isActive: true } });
    if (!businessType) throw new NotFoundException('Active business type not found.');
    const businessIndustry = await this.industries.findOne({ where: { id: input.businessIndustryId, level: 4 } });
    if (!businessIndustry) throw new NotFoundException('Level 4 business industry not found.');
    const existingEmail = await this.users.findByEmail(input.email);
    if (existingEmail && existingEmail.id !== record.userId) throw new ConflictException('Email is already in use.');

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
    if (businessLicense) record.businessLicenseUrl = await storeEnterpriseFile(businessLicense);
    if (otherDocument) record.otherDocumentUrl = await storeEnterpriseFile(otherDocument);
    record.user.fullname = input.name;
    record.user.email = input.email;
    await this.users.save(record.user);
    await this.enterprises.save(record);
    return { message: 'Enterprise updated successfully', data: this.toResponse(record) };
  }

  async deleteMany(input: DeleteEnterprisesDto) {
    const records = await this.enterprises.find({ where: { id: In(input.enterpriseIds) } });
    const result = await this.users.deleteUsers(records.map((record) => record.userId));
    return { message: 'Enterprises deleted successfully', data: { deletedCount: result.data.deletedCount } };
  }

  private toResponse(record: Enterprise) {
    return {
      enterpriseId: record.id, userId: record.userId, name: record.name, taxCode: record.taxCode,
      businessType: record.businessType?.name || '',
      businessIndustry: record.businessIndustry?.name || '', ward: record.ward,
      isActive: record.user?.isActive ?? false,
    };
  }
}
