import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';
export class DeleteEnterprisesDto {
  @IsArray() @ArrayNotEmpty() @IsUUID('4', { each: true }) enterpriseIds: string[];
}
