import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileAndEmailChangeRequests1710000000000 implements MigrationInterface {
  name = 'AddUserProfileAndEmailChangeRequests1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "fullname" character varying,
        ADD COLUMN IF NOT EXISTS "avatarUrl" character varying,
        ADD COLUMN IF NOT EXISTS "birthDate" date,
        ADD COLUMN IF NOT EXISTS "gender" character varying(10),
        ADD COLUMN IF NOT EXISTS "position" character varying,
        ADD COLUMN IF NOT EXISTS "province" character varying,
        ADD COLUMN IF NOT EXISTS "ward" character varying,
        ADD COLUMN IF NOT EXISTS "address" character varying,
        ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true
    `);
    await queryRunner.query(`
      CREATE TABLE "email_change_requests" (
        "id" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "newEmail" character varying NOT NULL,
        "otpHash" character varying(64) NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_change_requests_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_email_change_requests_new_email" UNIQUE ("newEmail"),
        CONSTRAINT "FK_email_change_requests_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_email_change_requests_user" ON "email_change_requests" ("userId")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "email_change_requests"`);
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "fullname",
        DROP COLUMN IF EXISTS "avatarUrl",
        DROP COLUMN IF EXISTS "birthDate",
        DROP COLUMN IF EXISTS "gender",
        DROP COLUMN IF EXISTS "position",
        DROP COLUMN IF EXISTS "province",
        DROP COLUMN IF EXISTS "ward",
        DROP COLUMN IF EXISTS "address",
        DROP COLUMN IF EXISTS "isActive"
    `);
  }
}
