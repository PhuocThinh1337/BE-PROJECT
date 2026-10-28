"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const role_entity_1 = require("../modules/role/role.entity");
const user_entity_1 = require("../modules/user/user.entity");
async function seedAuthUsers() {
    require('dotenv').config();
    if (process.env.NODE_ENV !== 'development') {
        throw new Error('Chỉ được tạo tài khoản mẫu trong môi trường phát triển.');
    }
    const connection = await (0, typeorm_1.createConnection)({
        type: 'postgres',
        host: process.env.VNA_DB_HOST,
        port: Number(process.env.VNA_DB_PORT || 5432),
        username: process.env.VNA_DB_USER,
        password: process.env.VNA_DB_PASSWORD,
        database: process.env.VNA_DB_DATABASE,
        entities: [user_entity_1.User, role_entity_1.Role],
        synchronize: false,
    });
    try {
        const roles = connection.getRepository(role_entity_1.Role);
        const users = connection.getRepository(user_entity_1.User);
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
            }
            else if (!existing) {
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
        console.log('Development authentication accounts are ready.');
    }
    finally {
        await connection.close();
    }
}
seedAuthUsers().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=auth.seed.js.map
