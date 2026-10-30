import * as SQLite from 'expo-sqlite';
import type { Trip } from '../types/trip';
import { demoTrips } from './demo';

// Alle Ansichten verwenden dieselbe Verbindung zur lokalen Datenbank.
let connection: Promise<SQLite.SQLiteDatabase> | null = null;

async function database() {
  if (!connection)
    connection = open().catch((error) => {
      connection = null;
      throw error;
    });
  return connection;
}

async function open() {
  const db = await SQLite.openDatabaseAsync('pinmap-plan19.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS trips (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
  `);
  const initialized = await db.getFirstAsync(
    'SELECT value FROM settings WHERE key = ?',
    'initialized',
  );
  // Beispielreisen nur beim ersten Start anlegen, auch wenn später alle gelöscht werden.
  if (!initialized) {
    await db.withTransactionAsync(async () => {
      for (const trip of demoTrips) {
        await db.runAsync(
          'INSERT OR IGNORE INTO trips (id, data) VALUES (?, ?)',
          trip.id,
          JSON.stringify(trip),
        );
      }
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?)',
        'initialized',
        'yes',
      );
    });
  }
  return db;
}

// KISS: Eine komplette Reise wird als JSON in einer SQLite-Zeile gespeichert.
// Für diese kleine lokale App sind keine komplizierten Tabellenabfragen nötig.
export async function loadTrips(): Promise<Trip[]> {
  const db = await database();
  const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM trips');
  return rows.map((row) => JSON.parse(row.data) as Trip);
}

export async function writeTrip(trip: Trip) {
  const db = await database();
  // ? sind Platzhalter: Werte werden getrennt vom SQL übergeben.
  // Die gleiche ID ersetzt eine Reise; eine neue ID legt eine Reise an.
  await db.runAsync(
    'INSERT OR REPLACE INTO trips (id, data) VALUES (?, ?)',
    trip.id,
    JSON.stringify(trip),
  );
}

export async function removeTrip(id: string) {
  const db = await database();
  await db.runAsync('DELETE FROM trips WHERE id = ?', id);
}
