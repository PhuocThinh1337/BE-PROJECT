import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccidentReportAudit1860000000000 implements MigrationInterface {
  name = 'AddAccidentReportAudit1860000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accident_reports"
      ADD COLUMN "submittedAt" TIMESTAMP WITH TIME ZONE NULL,
      ADD COLUMN "reviewedAt" TIMESTAMP WITH TIME ZONE NULL,
      ADD COLUMN "reviewedByUserId" uuid NULL`);
    await queryRunner.query(`ALTER TABLE "accident_reports" ADD CONSTRAINT "FK_accident_reports_reviewer"
      FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL`);
    await queryRunner.query(`UPDATE "accident_reports" SET "submittedAt" = "updatedAt"
      WHERE "status" IN ('ACCEPTED', 'APPROVED', 'DECLINED')`);
    await queryRunner.query(`UPDATE "accident_reports" SET "reviewedAt" = "updatedAt"
      WHERE "status" IN ('APPROVED', 'DECLINED')`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accident_reports" DROP CONSTRAINT "FK_accident_reports_reviewer"`);
    await queryRunner.query(`ALTER TABLE "accident_reports"
      DROP COLUMN "reviewedByUserId",
      DROP COLUMN "reviewedAt",
      DROP COLUMN "submittedAt"`);
  }
}
