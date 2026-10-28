import { IsDateString, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToNull = ({ value }: { value: unknown }) => value === '' ? null : value;
const nullSentinel = ({ value }: { value: unknown }) => value === 'null' ? null : value;

export class UpdateEnterpriseDto {
  @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @IsOptional() @Transform(emptyToNull) @IsDateString() licenseIssueDate?: string | null;
  @IsUUID('4') businessTypeId: string;
  @IsUUID('4') businessIndustryId: string;
  @IsString() @IsNotEmpty() @MaxLength(150) province: string;
  @IsString() @IsNotEmpty() @MaxLength(150) ward: string;
  @IsOptional() @Transform(emptyToNull) @IsString() @MaxLength(500) address?: string | null;
  @IsOptional() @Transform(emptyToNull) @IsString() @MaxLength(200) foreignName?: string | null;
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() @MaxLength(254) email: string;
  @IsOptional() @Transform(emptyToNull) @IsString() @MaxLength(30) officePhone?: string | null;
  @IsOptional() @Transform(emptyToNull) @IsString() @MaxLength(150) operatingProvince?: string | null;
  @IsOptional() @Transform(emptyToNull) @IsString() @MaxLength(150) operatingWard?: string | null;
  @IsOptional() @Transform(emptyToNull) @IsString() @MaxLength(500) businessLocation?: string | null;
  @IsOptional() @Transform(emptyToNull) @IsString() @MaxLength(150) representative?: string | null;
  @IsOptional() @Transform(emptyToNull) @IsString() @MaxLength(30) representativePhone?: string | null;
  // Omit to keep the current file, send "null" to remove it, or upload a file to replace it.
  @IsOptional() @Transform(nullSentinel) @IsString() @IsIn(['null']) businessLicense?: string | null;
  @IsOptional() @Transform(nullSentinel) @IsString() @IsIn(['null']) otherDocument?: string | null;
}
