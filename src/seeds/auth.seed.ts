import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { Role } from '../modules/role/role.entity';
import { User } from '../modules/user/user.entity';

async function seedAuthUsers() {
  require('dotenv').config();
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Chỉ được tạo tài khoản xác thực mẫu trong môi trường phát triển.');
  }

  const connection = await createConnection({
    type: 'postgres',
    host: process.env.VNA_DB_HOST,
    port: Number(process.env.VNA_DB_PORT || 5432),
    username: process.env.VNA_DB_USER,
    password: process.env.VNA_DB_PASSWORD,
    database: process.env.VNA_DB_DATABASE,
    entities: [User, Role],
    synchronize: false,
  });
  try {
    const roles = connection.getRepository(Role);
    const users = connection.getRepository(User);
    const accounts = [
      { username: 'so_admin', role: 'SO', name: 'So Admin', email: process.env.AUTH_DEMO_SO_EMAIL || null },
      { username: 'dn_demo', role: 'DOANH_NGHIEP', name: 'Doanh nghiep', email: process.env.AUTH_DEMO_DN_EMAIL || null },
    ];

    for (const account of accounts) {
      let role = await roles.findOne({ where: { role: account.role } });
      if (!role) {
        role = await roles.save(roles.create({ role: account.role, name: account.name }));
      }

      const existing = await users.findOne({ where: { username: account.username } });
      if (existing && account.email && existing.email !== account.email) {
        existing.email = account.email;
        await users.save(existing);
      } else if (!existing) {
        await users.save(users.create({
          username: account.username,
          password: process.env.AUTH_DEMO_PASSWORD || 'Test@123456',
          fullname: account.name,
          role,
          status: false,
          isActive: true,
          email: account.email,
        }));
      }
    }
    console.log('Các tài khoản xác thực mẫu trong môi trường phát triển đã sẵn sàng.');
  } finally {
    await connection.close();
  }
}

seedAuthUsers().catch((error) => {
  console.error(error);
  process.exit(1);
});
