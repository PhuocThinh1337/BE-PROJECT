import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeAccidentReportTables1820000000000 implements MigrationInterface {
  name = 'NormalizeAccidentReportTables1820000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "accident_stats" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "accidentReportId" uuid NOT NULL,
      "isSubsidizedAccident" boolean NOT NULL DEFAULT false,
      "totalCases" integer NOT NULL DEFAULT 0, "fatalCases" integer NOT NULL DEFAULT 0,
      "totalCasesWithTwoOrMoreVictims" integer NOT NULL DEFAULT 0, "totalDaysOff" integer NOT NULL DEFAULT 0,
      "totalExpense" double precision NOT NULL DEFAULT 0, "totalVictims" integer NOT NULL DEFAULT 0,
      "medicalExpense" double precision NOT NULL DEFAULT 0, "nonManagedVictims" integer NOT NULL DEFAULT 0,
      "totalFatalVictims" integer NOT NULL DEFAULT 0, "totalFemaleVictims" integer NOT NULL DEFAULT 0,
      "compensationExpense" double precision NOT NULL DEFAULT 0, "propertyDamageExpense" double precision NOT NULL DEFAULT 0,
      "nonManagedFatalVictims" integer NOT NULL DEFAULT 0, "nonManagedFemaleVictims" integer NOT NULL DEFAULT 0,
      "totalSeverelyInjuredVictims" integer NOT NULL DEFAULT 0, "salaryExpenseDuringTreatment" double precision NOT NULL DEFAULT 0,
      "nonManagedSeverelyInjuredVictims" integer NOT NULL DEFAULT 0,
      CONSTRAINT "PK_accident_stats" PRIMARY KEY ("id"),
      CONSTRAINT "FK_accident_stats_report" FOREIGN KEY ("accidentReportId") REFERENCES "accident_reports"("id") ON DELETE CASCADE,
      CONSTRAINT "UQ_accident_stats_report_subsidized" UNIQUE ("accidentReportId", "isSubsidizedAccident")
    )`);
    await queryRunner.query(`CREATE TABLE "accident_details" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "injuryTypeId" uuid NOT NULL, "injuryFactorId" uuid NOT NULL, "occupationId" uuid NOT NULL,
      "totalVictims" integer NOT NULL DEFAULT 0, "nonManagedVictims" integer NOT NULL DEFAULT 0,
      "totalFemaleVictims" integer NOT NULL DEFAULT 0, "nonManagedFemaleVictims" integer NOT NULL DEFAULT 0,
      "totalFatalVictims" integer NOT NULL DEFAULT 0, "nonManagedFatalVictims" integer NOT NULL DEFAULT 0,
      "totalSeverelyInjuredVictims" integer NOT NULL DEFAULT 0, "nonManagedSeverelyInjuredVictims" integer NOT NULL DEFAULT 0,
      "medicalExpense" double precision NOT NULL DEFAULT 0, "salaryExpenseDuringTreatment" double precision NOT NULL DEFAULT 0,
      "compensationExpense" double precision NOT NULL DEFAULT 0, "totalExpense" double precision NOT NULL DEFAULT 0,
      "totalDaysOff" integer NOT NULL DEFAULT 0, "propertyDamageExpense" double precision NOT NULL DEFAULT 0,
      CONSTRAINT "PK_accident_details" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE TABLE "accident_report_details" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "accidentReportId" uuid NOT NULL, "accidentDetailId" uuid NOT NULL,
      CONSTRAINT "PK_accident_report_details" PRIMARY KEY ("id"),
      CONSTRAINT "FK_accident_report_details_report" FOREIGN KEY ("accidentReportId") REFERENCES "accident_reports"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_accident_report_details_detail" FOREIGN KEY ("accidentDetailId") REFERENCES "accident_details"("id") ON DELETE CASCADE,
      CONSTRAINT "UQ_accident_report_details_pair" UNIQUE ("accidentReportId", "accidentDetailId")
    )`);

    const reports: any[] = await queryRunner.query(`SELECT "id", "accidentTotals", "subsidizedAccident", "accidentDetails" FROM "accident_reports"`);
    const statsFields = ['totalCases', 'fatalCases', 'totalCasesWithTwoOrMoreVictims', 'totalDaysOff', 'totalExpense', 'totalVictims', 'medicalExpense', 'nonManagedVictims', 'totalFatalVictims', 'totalFemaleVictims', 'compensationExpense', 'propertyDamageExpense', 'nonManagedFatalVictims', 'nonManagedFemaleVictims', 'totalSeverelyInjuredVictims', 'salaryExpenseDuringTreatment', 'nonManagedSeverelyInjuredVictims'];
    for (const report of reports) {
      for (const [json, subsidized] of [[report.accidentTotals, false], [report.subsidizedAccident, true]] as any[]) {
        if (!json) continue;
        const values = statsFields.map((field) => Number(json[field] || 0));
        await queryRunner.query(`INSERT INTO "accident_stats" ("accidentReportId", "isSubsidizedAccident", ${statsFields.map((field) => `"${field}"`).join(',')}) VALUES ($1,$2,${values.map((_, i) => `$${i + 3}`).join(',')})`, [report.id, subsidized, ...values]);
      }
      const details = Array.isArray(report.accidentDetails) ? report.accidentDetails : [];
      for (const item of details) {
        const detailId = item.accidentDetailId || undefined;
        const fields = ['injuryTypeId', 'injuryFactorId', 'occupationId', 'totalVictims', 'nonManagedVictims', 'totalFemaleVictims', 'nonManagedFemaleVictims', 'totalFatalVictims', 'nonManagedFatalVictims', 'totalSeverelyInjuredVictims', 'nonManagedSeverelyInjuredVictims', 'medicalExpense', 'salaryExpenseDuringTreatment', 'compensationExpense', 'totalExpense', 'totalDaysOff', 'propertyDamageExpense'];
        const values = fields.map((field) => item[field] == null ? (field.endsWith('Id') ? null : 0) : item[field]);
        const inserted: any[] = await queryRunner.query(`INSERT INTO "accident_details" ("id", ${fields.map((field) => `"${field}"`).join(',')}) VALUES (COALESCE($1::uuid, gen_random_uuid()), ${values.map((_, i) => `$${i + 2}`).join(',')}) RETURNING "id"`, [detailId, ...values]);
        await queryRunner.query(`INSERT INTO "accident_report_details" ("accidentReportId", "accidentDetailId") VALUES ($1,$2)`, [report.id, inserted[0].id]);
      }
    }
    await queryRunner.query(`ALTER TABLE "accident_reports" DROP COLUMN "accidentTotals", DROP COLUMN "accidentDetails", DROP COLUMN "subsidizedAccident"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accident_reports" ADD COLUMN "accidentTotals" jsonb NULL, ADD COLUMN "accidentDetails" jsonb NULL, ADD COLUMN "subsidizedAccident" jsonb NULL`);
    const stats: any[] = await queryRunner.query(`SELECT * FROM "accident_stats"`);
    for (const row of stats) {
      const fields = ['totalCases', 'fatalCases', 'totalCasesWithTwoOrMoreVictims', 'totalDaysOff', 'totalExpense', 'totalVictims', 'medicalExpense', 'nonManagedVictims', 'totalFatalVictims', 'totalFemaleVictims', 'compensationExpense', 'propertyDamageExpense', 'nonManagedFatalVictims', 'nonManagedFemaleVictims', 'totalSeverelyInjuredVictims', 'salaryExpenseDuringTreatment', 'nonManagedSeverelyInjuredVictims'];
      const json = fields.reduce((result, field) => { result[field] = row[field]; return result; }, {} as any);
      await queryRunner.query(`UPDATE "accident_reports" SET "${row.isSubsidizedAccident ? 'subsidizedAccident' : 'accidentTotals'}" = $1::jsonb WHERE "id" = $2`, [JSON.stringify(json), row.accidentReportId]);
    }
    await queryRunner.query(`UPDATE "accident_reports" r SET "accidentDetails" = COALESCE((SELECT jsonb_agg(to_jsonb(d) - 'id') FROM "accident_report_details" l JOIN "accident_details" d ON d."id"=l."accidentDetailId" WHERE l."accidentReportId"=r."id"), '[]'::jsonb)`);
    await queryRunner.query(`DROP TABLE "accident_report_details"`);
    await queryRunner.query(`DROP TABLE "accident_details"`);
    await queryRunner.query(`DROP TABLE "accident_stats"`);
  }
}
