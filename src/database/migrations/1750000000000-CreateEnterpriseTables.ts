import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnterpriseTables1750000000000 implements MigrationInterface {
  name = 'CreateEnterpriseTables1750000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
    await queryRunner.query(`INSERT INTO "roles" ("role", "name") VALUES ('SO', 'SO'), ('DOANH_NGHIEP', 'Enterprise') ON CONFLICT ("role") DO NOTHING`);
    await queryRunner.query(`CREATE TABLE "business_types" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "code" character varying(50) NOT NULL,
      "name" character varying(100) NOT NULL, "isActive" boolean NOT NULL DEFAULT true,
      CONSTRAINT "PK_business_types_id" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_business_types_code" UNIQUE ("code"), CONSTRAINT "UQ_business_types_name" UNIQUE ("name")
    )`);
    await queryRunner.query(`CREATE TABLE "business_industries" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "code" character varying(50) NOT NULL,
      "name" character varying(150) NOT NULL, "level" integer NOT NULL DEFAULT 4,
      CONSTRAINT "PK_business_industries_id" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_business_industries_code" UNIQUE ("code"), CONSTRAINT "UQ_business_industries_name" UNIQUE ("name")
    )`);
    await queryRunner.query(`INSERT INTO "business_types" ("code", "name") VALUES
      ('DNTN', 'Private enterprise'), ('TNHH', 'Limited liability company'),
      ('CTCP', 'Joint stock company'), ('CTHD', 'Partnership') ON CONFLICT ("code") DO NOTHING`);
    await queryRunner.query(`INSERT INTO "business_industries" ("code", "name", "level") VALUES
      ('CNTT', 'Information technology', 4), ('TM-DV', 'Trade and services', 4),
      ('SX', 'Manufacturing', 4), ('XD', 'Construction', 4),
      ('VT', 'Transportation', 4) ON CONFLICT ("code") DO NOTHING`);
    await queryRunner.query(`CREATE TABLE "enterprises" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL,
      "taxCode" character varying(10) NOT NULL, "name" character varying(200) NOT NULL,
      "licenseIssueDate" date, "businessTypeId" uuid NOT NULL, "businessIndustryId" uuid NOT NULL,
      "province" character varying(150) NOT NULL, "ward" character varying(150) NOT NULL,
      "address" character varying(500), "foreignName" character varying(200), "email" character varying(254) NOT NULL,
      "officePhone" character varying(30), "operatingProvince" character varying(150),
      "operatingWard" character varying(150), "businessLocation" character varying(500),
      "representative" character varying(150), "representativePhone" character varying(30),
      "businessLicenseUrl" character varying, "otherDocumentUrl" character varying,
      CONSTRAINT "PK_enterprises_id" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_enterprises_userId" UNIQUE ("userId"), CONSTRAINT "UQ_enterprises_taxCode" UNIQUE ("taxCode"),
      CONSTRAINT "FK_enterprises_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_enterprises_businessType" FOREIGN KEY ("businessTypeId") REFERENCES "business_types"("id"),
      CONSTRAINT "FK_enterprises_businessIndustry" FOREIGN KEY ("businessIndustryId") REFERENCES "business_industries"("id")
    )`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "enterprises"`);
    await queryRunner.query(`DROP TABLE "business_industries"`);
    await queryRunner.query(`DROP TABLE "business_types"`);
  }
}
