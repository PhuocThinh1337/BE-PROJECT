import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillEnterpriseTaxCodes1800000000000 implements MigrationInterface {
  name = 'BackfillEnterpriseTaxCodes1800000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "enterprises" e
      SET "taxCode" = CASE
        WHEN u."username" ~ '^[0-9]{13}$' THEN substring(u."username" from 1 for 10) || '-' || substring(u."username" from 11 for 3)
        ELSE u."username"
      END
      FROM "users" u
      WHERE e."userId" = u."id"
        AND e."taxCode" IS NULL
        AND u."username" ~ '^([0-9]{10}|[0-9]{13}|[0-9]{10}-[0-9]{3})$'
    `);
    await queryRunner.query(`
      UPDATE "users" u
      SET "username" = e."taxCode"
      FROM "enterprises" e
      WHERE e."userId" = u."id"
        AND e."taxCode" ~ '^[0-9]{10}-[0-9]{3}$'
        AND u."username" = replace(e."taxCode", '-', '')
    `);
    await queryRunner.query(`ALTER TABLE "enterprises" ALTER COLUMN "taxCode" SET NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "enterprises" ALTER COLUMN "taxCode" DROP NOT NULL`);
  }
}
