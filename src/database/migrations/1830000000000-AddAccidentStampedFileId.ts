import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccidentStampedFileId1830000000000 implements MigrationInterface {
  name = 'AddAccidentStampedFileId1830000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accident_reports" ADD COLUMN "stampedReportFileId" uuid NULL`);
    await queryRunner.query(`UPDATE "accident_reports" SET "stampedReportFileId" = gen_random_uuid() WHERE "stampedReportUrl" IS NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accident_reports" DROP COLUMN "stampedReportFileId"`);
  }
}
