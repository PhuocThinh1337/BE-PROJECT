import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { AccidentReportPeriod } from '../accident-report.entity';

export const REPORT_FIELDS = ['totalEmployees', 'femaleEmployees', 'totalSalaryFund', 'accidentTotals', 'accidentDetails', 'subsidizedAccident'] as const;

export type ReportConfigYearsResponse = number[];

export class UpdateReportPeriodConfigDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12) deadlineMonth?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(31) deadlineDay?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) requiredFields?: string[];
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

export class ExtendReportDeadlineDto {
  @IsEnum(AccidentReportPeriod) period: AccidentReportPeriod;
  @Type(() => Number) @IsInt() @Min(2000) @Max(new Date().getFullYear() + 20) year: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(365) additionalDays: number;
}

export class ListReportDeadlineExtensionsDto {
  @Type(() => Number) @IsInt() @Min(2000) @Max(new Date().getFullYear() + 20) year: number;
}

export class CreateAccidentCategoryDto {
  @IsString() @MaxLength(50) code: string;
  @IsString() @MaxLength(200) name: string;
}

export class UpdateAccidentCategoryDto {
  @IsOptional() @IsString() @MaxLength(50) code?: string;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
