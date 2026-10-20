import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailChangeVerifiedAt1730000000000 implements MigrationInterface {
  name = 'AddEmailChangeVerifiedAt1730000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "email_change_requests"
      ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMPTZ
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "email_change_requests"
      DROP COLUMN IF EXISTS "verifiedAt"
    `);
  }
}
