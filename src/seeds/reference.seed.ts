import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { Role } from '../modules/role/role.entity';
import { User } from '../modules/user/user.entity';
import { BusinessIndustry, BusinessType } from '../modules/enterprise/enterprise-reference.entity';

const rolesToSeed = [
  { role: 'SO', name: 'Sở' },
  { role: 'DOANH_NGHIEP', name: 'Doanh nghiệp' },
];

const businessTypesToSeed = [
  { code: 'DNTN', name: 'Doanh nghiệp tư nhân' },
  { code: 'TNHH', name: 'Công ty trách nhiệm hữu hạn' },
  { code: 'CTCP', name: 'Công ty cổ phần' },
  { code: 'CTHD', name: 'Công ty hợp danh' },
  { code: 'HTX', name: 'Hợp tác xã' },
  { code: 'TNHH1TV', name: 'Công ty TNHH một thành viên' },
  { code: 'TNHH2TV', name: 'Công ty TNHH hai thành viên trở lên' },
  { code: 'DNCVNN', name: 'Doanh nghiệp có vốn đầu tư nước ngoài' },
  { code: 'CN', name: 'Chi nhánh doanh nghiệp' },
  { code: 'VPDD', name: 'Văn phòng đại diện' },
];

const businessIndustriesToSeed = [
  { code: 'CNTT', name: 'Công nghệ thông tin', level: 4 },
  { code: 'TM-DV', name: 'Thương mại và dịch vụ', level: 4 },
  { code: 'SX', name: 'Sản xuất', level: 4 },
  { code: 'XD', name: 'Xây dựng', level: 4 },
  { code: 'VT', name: 'Vận tải', level: 4 },
  { code: 'NN', name: 'Nông nghiệp và lâm nghiệp', level: 4 },
  { code: 'TP', name: 'Chế biến thực phẩm', level: 4 },
  { code: 'DL', name: 'Du lịch và lữ hành', level: 4 },
  { code: 'GD', name: 'Giáo dục và đào tạo', level: 4 },
  { code: 'YT', name: 'Y tế và chăm sóc sức khỏe', level: 4 },
  { code: 'TC', name: 'Tài chính và kế toán', level: 4 },
  { code: 'BDS', name: 'Kinh doanh bất động sản', level: 4 },
  { code: 'LOG', name: 'Logistics và kho vận', level: 4 },
  { code: 'NH', name: 'Nhà hàng và dịch vụ ăn uống', level: 4 },
  { code: 'TT', name: 'Truyền thông và quảng cáo', level: 4 },
  { code: 'TV', name: 'Tư vấn và dịch vụ chuyên môn', level: 4 },
  { code: 'MT', name: 'Dịch vụ môi trường', level: 4 },
  { code: 'NL', name: 'Sản xuất và phân phối năng lượng', level: 4 },
  { code: 'VTEL', name: 'Viễn thông', level: 4 },
  { code: 'BL', name: 'Bán lẻ', level: 4 },
];
async function seedReferenceData() {
  require('dotenv').config();
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.VNA_DB_HOST,
    port: Number(process.env.VNA_DB_PORT || 5432),
    username: process.env.VNA_DB_USER,
    password: process.env.VNA_DB_PASSWORD,
    database: process.env.VNA_DB_DATABASE,
    entities: [User, Role, BusinessType, BusinessIndustry],
    synchronize: false,
  });

  try {
    const roles = connection.getRepository(Role);
    for (const value of rolesToSeed) {
      let role = await roles.findOne({ where: { role: value.role } });
      if (!role) role = roles.create(value);
      else role.name = value.name;
      await roles.save(role);
    }

    const businessTypes = connection.getRepository(BusinessType);
    for (const value of businessTypesToSeed) {
      let businessType = await businessTypes.findOne({ where: { code: value.code } });
      if (!businessType) businessType = businessTypes.create({ ...value, isActive: true });
      else {
        businessType.name = value.name;
        businessType.isActive = true;
      }
      await businessTypes.save(businessType);
    }

    const industries = connection.getRepository(BusinessIndustry);
    for (const value of businessIndustriesToSeed) {
      let industry = await industries.findOne({ where: { code: value.code } });
      if (!industry) industry = industries.create(value);
      else {
        industry.name = value.name;
        industry.level = value.level;
      }
      await industries.save(industry);
    }

    console.log('Reference roles, business types, and business industries are ready.');
  } finally {
    await connection.close();
  }
}

seedReferenceData().catch((error) => {
  console.error(error);
  process.exit(1);
});
