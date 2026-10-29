import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandEnterpriseTaxCodeLength1780000000000 implements MigrationInterface {
  name = 'ExpandEnterpriseTaxCodeLength1780000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "enterprises" ALTER COLUMN "taxCode" TYPE character varying(13)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "enterprises" ALTER COLUMN "taxCode" TYPE character varying(10)`);
  }
}
