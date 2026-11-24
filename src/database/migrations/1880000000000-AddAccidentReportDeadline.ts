import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccidentReportDeadline1880000000000 implements MigrationInterface {
  name = 'AddAccidentReportDeadline1880000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "accident_reports" ADD COLUMN "deadlineAt" TIMESTAMP WITH TIME ZONE NULL');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "accident_reports" DROP COLUMN "deadlineAt"');
  }
}
