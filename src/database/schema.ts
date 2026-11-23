// src/database/schema.ts
import * as SQLite from 'expo-sqlite';

export const DB_VERSION = 2;
export const DB_NAME = 'markers.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openAndInit();
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (!dbInstance) return;
  try {
    await dbInstance.closeAsync();
  } catch (e) {
    if (__DEV__) console.warn('[db] close error:', e);
  } finally {
    dbInstance = null;
  }
}

async function openAndInit(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA journal_mode = WAL;');

  await migrate(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const currentVersion = row?.user_version ?? 0;

  if (__DEV__) {
    console.log(`[db] current schema version: ${currentVersion}`);
  }

  if (currentVersion >= DB_VERSION) return;

  await db.withTransactionAsync(async () => {
    if (currentVersion < 1) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS markers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS marker_images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          marker_id INTEGER NOT NULL,
          uri TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (marker_id) REFERENCES markers (id) ON DELETE CASCADE
        );
      `);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_marker_images_marker_id
        ON marker_images (marker_id);
      `);
    }

    if (currentVersion < 2) {
      await db.execAsync('ALTER TABLE markers ADD COLUMN title TEXT;');
    }

    await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
  });

  if (__DEV__) {
    console.log(`[db] migrated to version ${DB_VERSION}`);
  }
}

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DROP TABLE IF EXISTS marker_images;');
    await db.execAsync('DROP TABLE IF EXISTS markers;');
    await db.execAsync('PRAGMA user_version = 0;');
  });
  if (__DEV__) console.log('[db] reset complete');
}