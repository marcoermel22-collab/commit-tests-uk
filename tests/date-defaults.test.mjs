import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyTrip, todayISO } from '../src/types/trip.ts';

test('Heutiges Datum verwendet den lokalen Kalendertag, auch nahe Mitternacht', () => {
  assert.equal(todayISO(new Date(2026, 9, 30, 0, 5)), '2026-10-30');
  assert.equal(todayISO(new Date(2026, 9, 30, 23, 55)), '2026-10-30');
  assert.equal(todayISO(new Date(2026, 0, 2)), '2026-01-02');
  assert.equal(todayISO(new Date(2024, 1, 29)), '2024-02-29');
});

test('Eine neue Reise startet und endet standardmaessig heute', () => {
  const before = todayISO();
  const trip = emptyTrip();
  const after = todayISO();
  assert.ok(trip.startDate === before || trip.startDate === after);
  assert.equal(trip.endDate, trip.startDate);
});
