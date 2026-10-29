import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertRoleIdsToUuid1740000000000 implements MigrationInterface {
  name = 'ConvertRoleIdsToUuid1740000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TEMP TABLE "role_id_uuid_map" ON COMMIT DROP AS
      SELECT "id" AS "oldId", gen_random_uuid() AS "newId" FROM "roles"
    `);
    await queryRunner.query(`ALTER TABLE "roles" ADD COLUMN "id_uuid" uuid`);
    await queryRunner.query(`
      UPDATE "roles" r SET "id_uuid" = m."newId"
      FROM "role_id_uuid_map" m WHERE r."id" = m."oldId"
    `);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "roleId_uuid" uuid`);
    await queryRunner.query(`
      UPDATE "users" u SET "roleId_uuid" = m."newId"
      FROM "role_id_uuid_map" m WHERE u."roleId" = m."oldId"
    `);
    await queryRunner.query(`
      DO $$ DECLARE constraint_name text; BEGIN
        FOR constraint_name IN
          SELECT c.conname FROM pg_constraint c
          WHERE c.contype = 'f' AND c.conrelid = 'users'::regclass
            AND c.confrelid = 'roles'::regclass
        LOOP
          EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_name);
        END LOOP;
      END $$
    `);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "roleId"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "roleId_uuid" TO "roleId"`);
    await queryRunner.query(`
      DO $$ DECLARE constraint_name text; BEGIN
        SELECT c.conname INTO constraint_name FROM pg_constraint c
        WHERE c.contype = 'p' AND c.conrelid = 'roles'::regclass;
        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE roles DROP CONSTRAINT %I', constraint_name);
        END IF;
      END $$
    `);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "id" CASCADE`);
    await queryRunner.query(`ALTER TABLE "roles" RENAME COLUMN "id_uuid" TO "id"`);
    await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")`);
    await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "FK_users_roleId_roles_id"
      FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_roleId_roles_id"`);
    await queryRunner.query(`
      DO $$ DECLARE constraint_name text; BEGIN
        SELECT c.conname INTO constraint_name FROM pg_constraint c
        WHERE c.contype = 'p' AND c.conrelid = 'roles'::regclass;
        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE roles DROP CONSTRAINT %I', constraint_name);
        END IF;
      END $$
    `);
    await queryRunner.query(`ALTER TABLE "roles" ADD COLUMN "id_int" serial`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "roleId_int" integer`);
    await queryRunner.query(`
      WITH role_map AS (
        SELECT "id", row_number() OVER (ORDER BY "id")::integer AS "intId" FROM "roles"
      )
      UPDATE "roles" r SET "id_int" = m."intId" FROM role_map m WHERE r."id" = m."id"
    `);
    await queryRunner.query(`
      WITH role_map AS (
        SELECT "id", "id_int" FROM "roles"
      )
      UPDATE "users" u SET "roleId_int" = m."id_int" FROM role_map m WHERE u."roleId" = m."id"
    `);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "roleId"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "roleId_int" TO "roleId"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "roles" RENAME COLUMN "id_int" TO "id"`);
    await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")`);

    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "FK_users_roleId_roles_id"
      FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }
}
