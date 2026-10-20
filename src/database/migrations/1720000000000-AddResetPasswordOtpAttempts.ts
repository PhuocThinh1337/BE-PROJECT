import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetPasswordOtpAttempts1720000000000 implements MigrationInterface {
  name = 'AddResetPasswordOtpAttempts1720000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "resetPasswordAttempts" integer NOT NULL DEFAULT 0
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "resetPasswordAttempts"`);
  }
}
