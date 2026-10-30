import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

test('Browser-Speicherung erhaelt Aenderungen und meldet Speicherfehler', async () => {
  // Die echte Datenbankdatei pruefen; nur die Browser-Schnittstelle wird ersetzt.
  const folder = mkdtempSync(join(tmpdir(), 'pinmap-test-'));
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  try {
    for (const [source, target] of [['demo.ts', 'demo.mjs'], ['database.web.ts', 'database.mjs']]) {
      const code = readFileSync(new URL(`../src/lib/${source}`, import.meta.url), 'utf8');
      const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace("from './demo'", "from './demo.mjs'");
      writeFileSync(join(folder, target), js);
    }
    const url = pathToFileURL(join(folder, 'database.mjs')).href;
    const db = await import(url);
    const initial = await db.loadTrips();
    const own = { ...structuredClone(initial[0]), id: 'own-test-trip', title: 'Eigene Reise' };
    await db.writeTrip(own);
    await db.writeTrip({ ...own, title: 'Geaenderte Reise' });
    const reopened = await import(url + '?restart=1');
    assert.equal((await reopened.loadTrips()).length, initial.length + 1);
    assert.equal((await reopened.loadTrips()).find(trip => trip.id === own.id).title, 'Geaenderte Reise');
    own.title = 'Nicht gespeichert';
    assert.equal((await db.loadTrips()).find(trip => trip.id === own.id).title, 'Geaenderte Reise');
    for (const trip of await db.loadTrips()) await db.removeTrip(trip.id);
    assert.deepEqual(await reopened.loadTrips(), []);
    storage.setItem = () => { throw new Error('Speicher voll'); };
    await assert.rejects(db.writeTrip(own), /Speicher voll/);
    assert.deepEqual(await db.loadTrips(), []);
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else delete globalThis.localStorage;
    rmSync(folder, { recursive: true, force: true });
  }
});
