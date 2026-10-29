import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { Role } from '../modules/role/role.entity';
import { User } from '../modules/user/user.entity';
import { BusinessIndustry, BusinessType } from '../modules/enterprise/enterprise-reference.entity';
import { Enterprise } from '../modules/enterprise/enterprise.entity';

const roleFixtures = [
  { role: 'SO', name: 'Sở' },
  { role: 'DOANH_NGHIEP', name: 'Doanh nghiệp' },
];

const businessTypeFixtures = [
  { code: 'TNHH', name: 'Công ty trách nhiệm hữu hạn' },
  { code: 'CTCP', name: 'Công ty cổ phần' },
];

const businessIndustryFixtures = [
  { code: 'CNTT', name: 'Công nghệ thông tin', level: 4 },
  { code: 'TM-DV', name: 'Thương mại và dịch vụ', level: 4 },
];

async function upsertByCode<T extends { code: string; name: string }>(
  repository: any,
  fixture: T,
  extra: Record<string, unknown> = {},
): Promise<any> {
  let record = await repository.findOne({ where: { code: fixture.code } });
  if (!record) record = repository.create({ ...fixture, ...extra });
  else Object.assign(record, fixture, extra);
  return repository.save(record);
}

async function seedAuthUsers() {
  require('dotenv').config();
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Chỉ được tạo tài khoản mẫu trong môi trường phát triển.');
  }

  const connection = await createConnection({
    type: 'postgres',
    host: process.env.VNA_DB_HOST,
    port: Number(process.env.VNA_DB_PORT || 5432),
    username: process.env.VNA_DB_USER,
    password: process.env.VNA_DB_PASSWORD,
    database: process.env.VNA_DB_DATABASE,
    entities: [User, Role, BusinessType, BusinessIndustry, Enterprise],
    synchronize: false,
  });

  try {
    const roles = connection.getRepository(Role);
    const roleByCode = new Map<string, Role>();
    for (const fixture of roleFixtures) {
      let role = await roles.findOne({ where: { role: fixture.role } });
      if (!role) role = roles.create(fixture);
      else role.name = fixture.name;
      roleByCode.set(fixture.role, await roles.save(role));
    }

    const businessTypes = connection.getRepository(BusinessType);
    const typeByCode = new Map<string, BusinessType>();
    for (const fixture of businessTypeFixtures) {
      typeByCode.set(fixture.code, await upsertByCode(businessTypes, fixture, { isActive: true }));
    }

    const industries = connection.getRepository(BusinessIndustry);
    const industryByCode = new Map<string, BusinessIndustry>();
    for (const fixture of businessIndustryFixtures) {
      industryByCode.set(fixture.code, await upsertByCode(industries, fixture));
    }

    const password = process.env.AUTH_DEMO_PASSWORD || 'Test@123456';
    const userFixtures = [
      {
        username: 'VNA00000001', legacyUsername: 'so_admin', roleCode: 'SO',
        fullname: 'Sở Admin', email: process.env.AUTH_DEMO_SO_EMAIL || 'so.admin@example.com',
        birthDate: '1985-04-12', gender: 'MALE' as const, position: 'Quản trị viên',
        province: 'Thành phố Hồ Chí Minh', ward: 'Phường Bến Nghé', address: '1 Lê Duẩn',
      },
      {
        username: 'VNA00000002', roleCode: 'SO', fullname: 'Nguyễn Minh Anh',
        email: 'so.staff@example.com', birthDate: '1994-09-21', gender: 'FEMALE' as const,
        position: 'Chuyên viên', province: 'Thành phố Hồ Chí Minh', ward: 'Phường Bến Nghé',
        address: '12 Nguyễn Huệ',
      },
      {
        username: '0312345678', legacyUsername: 'dn_demo', roleCode: 'DOANH_NGHIEP',
        fullname: 'Công ty TNHH VNA Demo', email: process.env.AUTH_DEMO_DN_EMAIL || 'enterprise.demo@example.com',
        birthDate: null, gender: null, position: null, province: 'Thành phố Hồ Chí Minh',
        ward: 'Phường Bến Nghé', address: '100 Nguyễn Huệ',
      },
      {
        username: '0101234567890', roleCode: 'DOANH_NGHIEP', fullname: 'Công ty Cổ phần VNA Sample',
        email: 'enterprise.sample@example.com', birthDate: null, gender: null, position: null,
        province: 'Thành phố Hà Nội', ward: 'Phường Tràng Tiền', address: '25 Tràng Tiền',
      },
    ];

    const users = connection.getRepository(User);
    const seededUsers = new Map<string, User>();
    for (const fixture of userFixtures) {
      let user = await users.findOne({ where: { username: fixture.username }, relations: ['role'] });
      if (!user && fixture.legacyUsername) {
        user = await users.findOne({ where: { username: fixture.legacyUsername }, relations: ['role'] });
      }
      const { legacyUsername: _legacyUsername, roleCode, ...profile } = fixture;
      const role = roleByCode.get(roleCode);
      if (!role) throw new Error(`Seed thiếu role ${roleCode}.`);
      if (!user) {
        user = users.create({ ...profile, password, role, status: false, isActive: true } as any) as unknown as User;
      } else {
        Object.assign(user, profile, { role, status: false, isActive: true });
      }
      seededUsers.set(fixture.username, await users.save(user));
    }

    const enterprises = connection.getRepository(Enterprise);
    const enterpriseFixtures = [
      {
        username: '0312345678', taxCode: '0312345678', name: 'Công ty TNHH VNA Demo',
        email: process.env.AUTH_DEMO_DN_EMAIL || 'enterprise.demo@example.com', businessTypeCode: 'TNHH',
        businessIndustryCode: 'CNTT', licenseIssueDate: '2022-06-15', province: 'Thành phố Hồ Chí Minh',
        ward: 'Phường Bến Nghé', address: '100 Nguyễn Huệ', foreignName: 'VNA Demo Company Limited',
        officePhone: '02812345678', operatingProvince: 'Thành phố Hồ Chí Minh', operatingWard: 'Phường Bến Nghé',
        businessLocation: '100 Nguyễn Huệ', representative: 'Trần Minh Khang', representativePhone: '0901234567',
      },
      {
        username: '0101234567890', taxCode: '0101234567890', name: 'Công ty Cổ phần VNA Sample',
        email: 'enterprise.sample@example.com', businessTypeCode: 'CTCP', businessIndustryCode: 'TM-DV',
        licenseIssueDate: '2023-03-01', province: 'Thành phố Hà Nội', ward: 'Phường Tràng Tiền',
        address: '25 Tràng Tiền', foreignName: 'VNA Sample Joint Stock Company', officePhone: '02412345678',
        operatingProvince: 'Thành phố Hà Nội', operatingWard: 'Phường Tràng Tiền',
        businessLocation: '25 Tràng Tiền', representative: 'Lê Thu Hà', representativePhone: '0912345678',
      },
    ];

    for (const fixture of enterpriseFixtures) {
      const user = seededUsers.get(fixture.username);
      const businessType = typeByCode.get(fixture.businessTypeCode);
      const businessIndustry = industryByCode.get(fixture.businessIndustryCode);
      if (!user || !businessType || !businessIndustry) throw new Error('Seed thiếu user hoặc danh mục doanh nghiệp.');

      let enterprise = await enterprises.findOne({ where: [{ userId: user.id }, { taxCode: fixture.taxCode }] });
      if (!enterprise) enterprise = enterprises.create();
      Object.assign(enterprise, {
        userId: user.id, user, taxCode: fixture.taxCode, name: fixture.name, email: fixture.email,
        businessTypeId: businessType.id, businessType, businessIndustryId: businessIndustry.id, businessIndustry,
        licenseIssueDate: fixture.licenseIssueDate, province: fixture.province, ward: fixture.ward,
        address: fixture.address, foreignName: fixture.foreignName, officePhone: fixture.officePhone,
        operatingProvince: fixture.operatingProvince, operatingWard: fixture.operatingWard,
        businessLocation: fixture.businessLocation, representative: fixture.representative,
        representativePhone: fixture.representativePhone,
      });
      await enterprises.save(enterprise);
    }

    console.log('Demo users and enterprises are ready: VNA00000001, VNA00000002, 0312345678, 0101234567890.');
    console.log('All demo accounts use AUTH_DEMO_PASSWORD (default Test@123456).');
    console.log('File fields are left empty; test uploads with multipart/form-data.');
  } finally {
    await connection.close();
  }
}

seedAuthUsers().catch((error) => {
  console.error(error);
  process.exit(1);
});
