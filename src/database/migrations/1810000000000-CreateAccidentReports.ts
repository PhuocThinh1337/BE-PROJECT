import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccidentReports1810000000000 implements MigrationInterface {
  name = 'CreateAccidentReports1810000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "accident_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" character varying(30) NOT NULL,
        "code" character varying(50) NOT NULL,
        "name" character varying(200) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_accident_categories_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_accident_categories_type_code" ON "accident_categories" ("type", "code")`);
    await queryRunner.query(`
      INSERT INTO "accident_categories" ("type", "code", "name") VALUES
      ('INJURY_TYPE', 'FALL', 'Ngã, rơi'),
      ('INJURY_TYPE', 'STRUCK', 'Va đập, vật rơi'),
      ('INJURY_TYPE', 'MACHINE', 'Máy móc, thiết bị'),
      ('INJURY_TYPE', 'ELECTRIC', 'Điện giật'),
      ('INJURY_TYPE', 'TRAFFIC', 'Tai nạn giao thông'),
      ('INJURY_TYPE', 'CHEMICAL', 'Hóa chất, nhiệt'),
      ('INJURY_TYPE', 'OTHER', 'Nguyên nhân khác'),
      ('INJURY_FACTOR', 'HEIGHT', 'Làm việc trên cao'),
      ('INJURY_FACTOR', 'MACHINE', 'Máy móc, thiết bị'),
      ('INJURY_FACTOR', 'ELECTRIC', 'Nguồn điện'),
      ('INJURY_FACTOR', 'ROAD', 'Phương tiện giao thông'),
      ('INJURY_FACTOR', 'CHEMICAL', 'Hóa chất'),
      ('INJURY_FACTOR', 'WORKPLACE', 'Mặt bằng, nơi làm việc'),
      ('INJURY_FACTOR', 'OTHER', 'Yếu tố khác'),
      ('OCCUPATION', 'MANAGEMENT', 'Quản lý'),
      ('OCCUPATION', 'OFFICE', 'Nhân viên văn phòng'),
      ('OCCUPATION', 'TECHNICIAN', 'Kỹ thuật viên'),
      ('OCCUPATION', 'CONSTRUCTION', 'Thợ xây dựng'),
      ('OCCUPATION', 'OPERATOR', 'Thợ vận hành máy'),
      ('OCCUPATION', 'DRIVER', 'Lái xe'),
      ('OCCUPATION', 'SERVICE', 'Dịch vụ, bán hàng'),
      ('OCCUPATION', 'LABORER', 'Lao động phổ thông'),
      ('OCCUPATION', 'OTHER', 'Nghề nghiệp khác')
      ON CONFLICT ("type", "code") DO NOTHING
    `);
    await queryRunner.query(`
      CREATE TABLE "accident_reports" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "enterpriseId" uuid NOT NULL,
        "year" integer NOT NULL,
        "reportPeriod" character varying(20) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'PENDING',
        "totalEmployees" integer NULL,
        "femaleEmployees" integer NULL,
        "totalSalaryFund" double precision NULL,
        "accidentTotals" jsonb NULL,
        "accidentDetails" jsonb NULL,
        "subsidizedAccident" jsonb NULL,
        "stampedReportUrl" character varying NULL,
        "stampedReportFileName" character varying NULL,
        "stampedReportContentType" character varying(150) NULL,
        "stampedReportSize" integer NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_accident_reports_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_accident_reports_enterprise" FOREIGN KEY ("enterpriseId") REFERENCES "enterprises"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_accident_reports_period" CHECK ("reportPeriod" IN ('SIX_MONTHS', 'FULL_YEAR')),
        CONSTRAINT "CHK_accident_reports_status" CHECK ("status" IN ('PENDING', 'IN_PROGRESS', 'ACCEPTED'))
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_accident_reports_enterprise_year_period" ON "accident_reports" ("enterpriseId", "year", "reportPeriod")`);
    await queryRunner.query(`CREATE INDEX "IDX_accident_reports_year_status" ON "accident_reports" ("year", "status")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "accident_reports"`);
    await queryRunner.query(`DROP TABLE "accident_categories"`);
  }
}
