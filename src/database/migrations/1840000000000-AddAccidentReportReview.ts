import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccidentReportReview1840000000000 implements MigrationInterface {
  name = 'AddAccidentReportReview1840000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accident_reports" ADD COLUMN "note" text NULL`);
    await queryRunner.query(`ALTER TABLE "accident_reports" DROP CONSTRAINT "CHK_accident_reports_status"`);
    await queryRunner.query(`ALTER TABLE "accident_reports" ADD CONSTRAINT "CHK_accident_reports_status" CHECK ("status" IN ('PENDING', 'IN_PROGRESS', 'ACCEPTED', 'APPROVED', 'DECLINED', 'EXPIRED'))`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "accident_reports" SET "status" = 'ACCEPTED' WHERE "status" IN ('APPROVED', 'DECLINED', 'EXPIRED')`);
    await queryRunner.query(`ALTER TABLE "accident_reports" DROP CONSTRAINT "CHK_accident_reports_status"`);
    await queryRunner.query(`ALTER TABLE "accident_reports" ADD CONSTRAINT "CHK_accident_reports_status" CHECK ("status" IN ('PENDING', 'IN_PROGRESS', 'ACCEPTED'))`);
    await queryRunner.query(`ALTER TABLE "accident_reports" DROP COLUMN "note"`);
  }
}
