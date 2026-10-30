import assert from 'node:assert/strict';
import test from 'node:test';
import { todayISO } from '../src/types/trip.ts';
import { findNearbyStop } from '../src/lib/location-utils.ts';

test('Lokaler Datumsvorschlag wechselt am Jahreswechsel', () => {
  assert.equal(todayISO(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
  assert.equal(todayISO(new Date(2027, 0, 1, 0, 0)), '2027-01-01');
});
test('Standortzuordnung respektiert die Ein-Kilometer-Grenze', () => {
  const origin = { latitude: 0, longitude: 0 };
  const stop = meters => ({ id: String(meters), name: 'Test', latitude: meters / 6371000 * 180 / Math.PI, longitude: 0, entries: [] });
  assert.equal(findNearbyStop([stop(999)], origin)?.id, '999');
  assert.equal(findNearbyStop([stop(1001)], origin), undefined);
});
