import { OmitType } from '@nestjs/swagger';
import { UpdateEnterpriseDto } from './update-enterprise.dto';

// Enterprise accounts cannot change their login email through this endpoint.
export class UpdateEnterpriseMeDto extends OmitType(UpdateEnterpriseDto, ['email'] as const) {}
