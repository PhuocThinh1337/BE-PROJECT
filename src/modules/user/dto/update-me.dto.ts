import { OmitType } from '@nestjs/swagger';
import { UpdateUserDto } from './update-user.dto';

export class UpdateMeDto extends OmitType(UpdateUserDto, ['isActive', 'avatarUrl'] as const) {}
