import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportPeriodDeadlines1870000000000 implements MigrationInterface {
  name = 'CreateReportPeriodDeadlines1870000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "report_period_deadlines" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "year" integer NOT NULL,
      "period" character varying(20) NOT NULL,
      "deadlineAt" TIMESTAMP WITH TIME ZONE NOT NULL,
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_report_period_deadlines" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_report_period_deadlines_year_period" UNIQUE ("year", "period")
    )`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "report_period_deadlines"`);
  }
}
