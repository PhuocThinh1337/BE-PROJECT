import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportConfiguration1850000000000 implements MigrationInterface {
  name = 'CreateReportConfiguration1850000000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "report_period_configs" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "period" character varying(20) NOT NULL,
      "enabled" boolean NOT NULL DEFAULT true, "deadlineMonth" integer NOT NULL,
      "deadlineDay" integer NOT NULL, "requiredFields" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "description" text NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_report_period_configs" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_report_period_configs_period" UNIQUE ("period"),
      CONSTRAINT "CHK_report_period_configs_period" CHECK ("period" IN ('SIX_MONTHS','FULL_YEAR')),
      CONSTRAINT "CHK_report_period_configs_month" CHECK ("deadlineMonth" BETWEEN 1 AND 12),
      CONSTRAINT "CHK_report_period_configs_day" CHECK ("deadlineDay" BETWEEN 1 AND 31)
    )`);
    await queryRunner.query(`INSERT INTO "report_period_configs" ("period","deadlineMonth","deadlineDay","requiredFields","description") VALUES
      ('SIX_MONTHS',7,5,'["totalEmployees","femaleEmployees","totalSalaryFund","accidentTotals","accidentDetails"]'::jsonb,'Báo cáo 6 tháng'),
      ('FULL_YEAR',1,10,'["totalEmployees","femaleEmployees","totalSalaryFund","accidentTotals","accidentDetails"]'::jsonb,'Báo cáo cả năm')`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "report_period_configs"');
  }
}
