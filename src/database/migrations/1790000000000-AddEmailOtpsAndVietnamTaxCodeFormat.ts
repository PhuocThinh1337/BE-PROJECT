import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailOtpsAndVietnamTaxCodeFormat1790000000000 implements MigrationInterface {
  name = 'AddEmailOtpsAndVietnamTaxCodeFormat1790000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "email_otps" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(254) NOT NULL,
        "purpose" character varying(30) NOT NULL,
        "requestedByUserId" uuid NULL,
        "otpHash" character varying(64) NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "verifiedAt" TIMESTAMP WITH TIME ZONE NULL,
        "consumedAt" TIMESTAMP WITH TIME ZONE NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_otps_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_email_otps_email_purpose" ON "email_otps" ("email", "purpose")`);
    await queryRunner.query(`ALTER TABLE "enterprises" ALTER COLUMN "taxCode" TYPE character varying(14)`);
    await queryRunner.query(`
      UPDATE "users" u SET "username" = substring(e."taxCode" from 1 for 10) || '-' || substring(e."taxCode" from 11 for 3)
      FROM "enterprises" e
      WHERE e."userId" = u."id" AND e."taxCode" ~ '^[0-9]{13}$'
    `);
    await queryRunner.query(`
      UPDATE "enterprises" SET "taxCode" = substring("taxCode" from 1 for 10) || '-' || substring("taxCode" from 11 for 3)
      WHERE "taxCode" ~ '^[0-9]{13}$'
    `);
    await queryRunner.query(`UPDATE "roles" SET "role" = upper("role") WHERE "role" <> upper("role")`);
    await queryRunner.query(`ALTER TABLE "enterprises" ADD CONSTRAINT "CHK_enterprises_taxCode_vn" CHECK ("taxCode" ~ '^[0-9]{10}(-[0-9]{3})?$')`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "enterprises" DROP CONSTRAINT "CHK_enterprises_taxCode_vn"`);
    await queryRunner.query(`
      UPDATE "users" u SET "username" = replace(e."taxCode", '-', '')
      FROM "enterprises" e WHERE e."userId" = u."id" AND e."taxCode" ~ '^[0-9]{10}-[0-9]{3}$'
    `);
    await queryRunner.query(`UPDATE "enterprises" SET "taxCode" = replace("taxCode", '-', '') WHERE "taxCode" ~ '^[0-9]{10}-[0-9]{3}$'`);
    await queryRunner.query(`ALTER TABLE "enterprises" ALTER COLUMN "taxCode" TYPE character varying(13)`);
    await queryRunner.query(`UPDATE "roles" SET "role" = lower("role")`);
    await queryRunner.query(`DROP INDEX "UQ_email_otps_email_purpose"`);
    await queryRunner.query(`DROP TABLE "email_otps"`);
  }
}
