import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../role/role.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { EnterpriseController } from './enterprise.controller';
import { Enterprise } from './enterprise.entity';
import { BusinessIndustry, BusinessType } from './enterprise-reference.entity';
import { EnterpriseService } from './enterprise.service';
import { EnterpriseReferenceController } from './enterprise-reference.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Enterprise, BusinessType, BusinessIndustry, Role]), UserModule, AuthModule],
  controllers: [EnterpriseController, EnterpriseReferenceController],
  providers: [EnterpriseService],
})
export class EnterpriseModule {}
