import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnterpriseFileMetadata1770000000000 implements MigrationInterface {
  name = 'AddEnterpriseFileMetadata1770000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "enterprises"
        ADD COLUMN IF NOT EXISTS "businessLicenseFileId" uuid,
        ADD COLUMN IF NOT EXISTS "businessLicenseFileName" character varying,
        ADD COLUMN IF NOT EXISTS "businessLicenseContentType" character varying(150),
        ADD COLUMN IF NOT EXISTS "businessLicenseSize" integer,
        ADD COLUMN IF NOT EXISTS "otherDocumentFileId" uuid,
        ADD COLUMN IF NOT EXISTS "otherDocumentFileName" character varying,
        ADD COLUMN IF NOT EXISTS "otherDocumentContentType" character varying(150),
        ADD COLUMN IF NOT EXISTS "otherDocumentSize" integer
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "enterprises"
        DROP COLUMN IF EXISTS "businessLicenseFileId",
        DROP COLUMN IF EXISTS "businessLicenseFileName",
        DROP COLUMN IF EXISTS "businessLicenseContentType",
        DROP COLUMN IF EXISTS "businessLicenseSize",
        DROP COLUMN IF EXISTS "otherDocumentFileId",
        DROP COLUMN IF EXISTS "otherDocumentFileName",
        DROP COLUMN IF EXISTS "otherDocumentContentType",
        DROP COLUMN IF EXISTS "otherDocumentSize"
    `);
  }
}
