import { BadRequestException } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { AccidentCategoryType } from '../accident-category.entity';
import { AccidentReportPeriod, AccidentReportStatus } from '../accident-report.entity';

const parseJson = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch (_error) { throw new BadRequestException('Dữ liệu báo cáo dạng JSON không hợp lệ.'); }
};
const emptyToNull = ({ value }: { value: unknown }) => value === '' ? null : value;

export class AccidentVictimCountsDto {
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) totalVictims?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) nonManagedVictims?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) totalFemaleVictims?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) nonManagedFemaleVictims?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) totalFatalVictims?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) nonManagedFatalVictims?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) totalSeverelyInjuredVictims?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) nonManagedSeverelyInjuredVictims?: number | null;
}

export class AccidentVictimStatsDto extends AccidentVictimCountsDto {
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) totalCases?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) fatalCases?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) totalCasesWithTwoOrMoreVictims?: number | null;
}

export class AccidentStatsDto extends AccidentVictimStatsDto {
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) medicalExpense?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) salaryExpenseDuringTreatment?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) compensationExpense?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) totalExpense?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) totalDaysOff?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) propertyDamageExpense?: number | null;
}

export class AccidentDetailDto extends AccidentVictimCountsDto {
  @IsOptional() @IsUUID('4') accidentDetailId?: string | null;
  @IsUUID('4') injuryTypeId: string;
  @IsUUID('4') injuryFactorId: string;
  @IsUUID('4') occupationId: string;

  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) medicalExpense?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) salaryExpenseDuringTreatment?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) compensationExpense?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) totalExpense?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) totalDaysOff?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) propertyDamageExpense?: number | null;
}

export class UpdateAccidentReportDto {
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) totalEmployees?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsInt() @Min(0) femaleEmployees?: number | null;
  @IsOptional() @Transform(emptyToNull) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) totalSalaryFund?: number | null;

  @IsOptional() @Transform(parseJson) @ValidateNested() @Type(() => AccidentStatsDto) accidentTotals?: AccidentStatsDto | null;
  @IsOptional() @Transform(parseJson) @ValidateNested({ each: true }) @Type(() => AccidentDetailDto) @IsArray() accidentDetails?: AccidentDetailDto[] | null;
  @IsOptional() @Transform(parseJson) @ValidateNested() @Type(() => AccidentStatsDto) subsidizedAccident?: AccidentStatsDto | null;
}

export class ListAccidentReportsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) size = 12;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(20) taxCode?: string;
  @IsOptional() @IsEnum(AccidentReportPeriod) reportPeriod?: AccidentReportPeriod;
  @IsOptional() @IsEnum(AccidentReportStatus) status?: AccidentReportStatus;
  @IsOptional() @IsString() @MaxLength(150) province?: string;
  @IsOptional() @IsString() @MaxLength(150) ward?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(2000) @Max(new Date().getFullYear() + 20) year?: number;
}

export class ListAccidentCategoriesDto {
  @IsEnum(AccidentCategoryType) type: AccidentCategoryType;
}
