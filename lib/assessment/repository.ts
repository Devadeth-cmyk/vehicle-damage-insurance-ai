import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { AssessmentRecord, AssessmentStatus } from "@/types/assessment";

/**
 * Interface defining assessment repository operations.
 */
export interface IAssessmentRepository {
  createAssessment(record: AssessmentRecord): Promise<AssessmentRecord>;
  findById(id: string): Promise<AssessmentRecord | null>;
  listByServiceCenter(serviceCenterId: string): Promise<AssessmentRecord[]>;
  listAll(): Promise<AssessmentRecord[]>;
  updateStatus(id: string, status: AssessmentStatus): Promise<AssessmentRecord | null>;
}

// Keep application data outside the source-code directories.
const dataDirectory = path.join(process.cwd(), "data");
const databasePath = path.join(dataDirectory, "autoinsight.db");

fs.mkdirSync(dataDirectory, { recursive: true });

const globalForAssessmentDatabase = global as typeof globalThis & {
  __autoinsight_assessment_sqlite?: Database.Database;
};

function getDatabase(): Database.Database {
  if (!globalForAssessmentDatabase.__autoinsight_assessment_sqlite) {
    const database = new Database(databasePath);

    database.pragma("journal_mode = WAL");

    database.exec(`
      CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        service_center_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        status TEXT NOT NULL,
        record_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_assessments_service_center
      ON assessments(service_center_id);

      CREATE INDEX IF NOT EXISTS idx_assessments_created_at
      ON assessments(created_at);
    `);

    globalForAssessmentDatabase.__autoinsight_assessment_sqlite = database;
  }

  return globalForAssessmentDatabase.__autoinsight_assessment_sqlite;
}

class SQLiteAssessmentRepository implements IAssessmentRepository {
  async createAssessment(record: AssessmentRecord): Promise<AssessmentRecord> {
    const database = getDatabase();

    const statement = database.prepare(`
      INSERT OR REPLACE INTO assessments (
        id,
        service_center_id,
        created_at,
        updated_at,
        status,
        record_json
      )
      VALUES (
        @id,
        @serviceCenterId,
        @createdAt,
        @updatedAt,
        @status,
        @recordJson
      )
    `);

    statement.run({
      id: record.id,
      serviceCenterId: record.serviceCenterId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      status: record.status,
      recordJson: JSON.stringify(record),
    });

    return { ...record };
  }

  async findById(id: string): Promise<AssessmentRecord | null> {
    const database = getDatabase();

    const row = database
      .prepare(`
        SELECT record_json
        FROM assessments
        WHERE id = ?
      `)
      .get(id) as { record_json: string } | undefined;

    if (!row) {
      return null;
    }

    return JSON.parse(row.record_json) as AssessmentRecord;
  }

  async listByServiceCenter(
    serviceCenterId: string
  ): Promise<AssessmentRecord[]> {
    const database = getDatabase();

    const rows = database
      .prepare(`
        SELECT record_json
        FROM assessments
        WHERE service_center_id = ?
        ORDER BY created_at DESC
      `)
      .all(serviceCenterId) as { record_json: string }[];

    return rows.map(
      (row) => JSON.parse(row.record_json) as AssessmentRecord
    );
  }

  async listAll(): Promise<AssessmentRecord[]> {
    const database = getDatabase();

    const rows = database
      .prepare(`
        SELECT record_json
        FROM assessments
        ORDER BY created_at DESC
      `)
      .all() as { record_json: string }[];

    return rows.map(
      (row) => JSON.parse(row.record_json) as AssessmentRecord
    );
  }

  async updateStatus(
    id: string,
    status: AssessmentStatus
  ): Promise<AssessmentRecord | null> {
    const database = getDatabase();

    const existing = await this.findById(id);

    if (!existing) {
      return null;
    }

    const updated: AssessmentRecord = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };

    database
      .prepare(`
        UPDATE assessments
        SET
          service_center_id = @serviceCenterId,
          created_at = @createdAt,
          updated_at = @updatedAt,
          status = @status,
          record_json = @recordJson
        WHERE id = @id
      `)
      .run({
        id: updated.id,
        serviceCenterId: updated.serviceCenterId,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        status: updated.status,
        recordJson: JSON.stringify(updated),
      });

    return { ...updated };
  }
}

export const assessmentRepository: IAssessmentRepository =
  new SQLiteAssessmentRepository();