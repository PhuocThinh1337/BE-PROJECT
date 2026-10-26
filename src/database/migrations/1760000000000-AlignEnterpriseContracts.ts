import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignEnterpriseContracts1760000000000 implements MigrationInterface {
  name = 'AlignEnterpriseContracts1760000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "business_types" ADD COLUMN IF NOT EXISTS "code" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "business_types" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`WITH numbered AS (SELECT "id", row_number() OVER (ORDER BY "id") AS n FROM "business_types" WHERE "code" IS NULL) UPDATE "business_types" t SET "code" = 'BT-' || lpad(numbered.n::text, 3, '0') FROM numbered WHERE t."id" = numbered."id"`);
    await queryRunner.query(`ALTER TABLE "business_types" ALTER COLUMN "code" SET NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_business_types_code" ON "business_types" ("code")`);
    await queryRunner.query(`ALTER TABLE "business_industries" ADD COLUMN IF NOT EXISTS "code" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "business_industries" ADD COLUMN IF NOT EXISTS "level" integer NOT NULL DEFAULT 4`);
    await queryRunner.query(`WITH numbered AS (SELECT "id", row_number() OVER (ORDER BY "id") AS n FROM "business_industries" WHERE "code" IS NULL) UPDATE "business_industries" t SET "code" = 'BI-' || lpad(numbered.n::text, 3, '0') FROM numbered WHERE t."id" = numbered."id"`);
    await queryRunner.query(`ALTER TABLE "business_industries" ALTER COLUMN "code" SET NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_business_industries_code" ON "business_industries" ("code")`);
    await queryRunner.query(`INSERT INTO "business_types" ("code", "name") VALUES ('DNTN', 'Private enterprise'), ('TNHH', 'Limited liability company'), ('CTCP', 'Joint stock company'), ('CTHD', 'Partnership') ON CONFLICT DO NOTHING`);
    await queryRunner.query(`INSERT INTO "business_industries" ("code", "name", "level") VALUES ('CNTT', 'Information technology', 4), ('TM-DV', 'Trade and services', 4), ('SX', 'Manufacturing', 4), ('XD', 'Construction', 4), ('VT', 'Transportation', 4) ON CONFLICT DO NOTHING`);

    await queryRunner.query(`ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "licenseIssueDate" date`);
    await queryRunner.query(`ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "businessTypeId" uuid`);
    await queryRunner.query(`ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "businessIndustryId" uuid`);
    await queryRunner.query(`ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "province" character varying(150) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "ward" character varying(150) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "address" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "foreignName" character varying(200)`);
    await queryRunner.query(`ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "email" character varying(254)`);
    await queryRunner.query(`ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "officePhone" character varying(30)`);
    await queryRunner.query(`ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "operatingProvince" character varying(150)`);
    await queryRunner.query(`ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "operatingWard" character varying(150)`);
    await queryRunner.query(`ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "businessLocation" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "representative" character varying(150)`);
    await queryRunner.query(`ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "representativePhone" character varying(30)`);
    await queryRunner.query(`UPDATE "enterprises" e SET "businessTypeId" = (SELECT "id" FROM "business_types" ORDER BY "code" LIMIT 1) WHERE e."businessTypeId" IS NULL`);
    await queryRunner.query(`UPDATE "enterprises" e SET "businessIndustryId" = (SELECT "id" FROM "business_industries" WHERE "level" = 4 ORDER BY "code" LIMIT 1) WHERE e."businessIndustryId" IS NULL`);
    await queryRunner.query(`UPDATE "enterprises" e SET "email" = COALESCE(u."email", e."taxCode" || '@unknown.invalid') FROM "users" u WHERE e."userId" = u."id" AND e."email" IS NULL`);
    await queryRunner.query(`ALTER TABLE "enterprises" ALTER COLUMN "email" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "enterprises" ALTER COLUMN "businessTypeId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "enterprises" ALTER COLUMN "businessIndustryId" SET NOT NULL`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_enterprises_businessType') THEN ALTER TABLE "enterprises" ADD CONSTRAINT "FK_enterprises_businessType" FOREIGN KEY ("businessTypeId") REFERENCES "business_types"("id"); END IF; IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_enterprises_businessIndustry') THEN ALTER TABLE "enterprises" ADD CONSTRAINT "FK_enterprises_businessIndustry" FOREIGN KEY ("businessIndustryId") REFERENCES "business_industries"("id"); END IF; END $$`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "enterprises" DROP CONSTRAINT IF EXISTS "FK_enterprises_businessIndustry"`);
    await queryRunner.query(`ALTER TABLE "enterprises" DROP CONSTRAINT IF EXISTS "FK_enterprises_businessType"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_business_industries_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_business_types_code"`);
  }
}
