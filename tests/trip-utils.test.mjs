import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterTrips,
  inputDate,
  parseDate,
  prepareTrip,
  tripPhotos,
  validateTrip,
} from '../src/lib/trip-utils.ts';

function trip() {
  return {
    id: 'test',
    title: 'Reise',
    startDate: '2026-07-12',
    endDate: '2026-07-19',
    tag: 'Sommer',
    stops: [
      {
        id: 'a',
        name: 'Bern',
        latitude: 46.9,
        longitude: 7.4,
        entries: [
          {
            id: 'e',
            title: 'Erster Tag',
            date: '2026-07-12',
            text: 'Spaziergang an der Aare',
            photos: ['bild1'],
          },
        ],
      },
      { id: 'b', name: 'Paris', latitude: 48.8, longitude: 2.3, entries: [] },
    ],
  };
}

test('Datumsprüfung erkennt Schaltjahre und unmögliche Kalendertage', () => {
  assert.equal(parseDate('29.02.2024'), '2024-02-29');
  for (const invalid of [
    '29.02.2025',
    '31.04.2026',
    '00.01.2026',
    '12.13.2026',
    '2026-01-12',
  ])
    assert.equal(parseDate(invalid), null);
  assert.equal(inputDate('2026-07-12'), '12.07.2026');
});
test('Eine gültige Reise mit mehreren Standorten wird akzeptiert', () =>
  assert.equal(validateTrip(trip()), null));
test('Pflichtangaben und umgekehrter Zeitraum werden abgewiesen', () => {
  assert.match(validateTrip({ ...trip(), title: '  ' }), /Titel/);
  assert.match(validateTrip({ ...trip(), endDate: '2026-07-01' }), /Enddatum/);
});
test('Standorte müssen benannt sein und gültige Koordinaten haben', () => {
  const draft = trip();
  draft.stops[1].name = '';
  assert.match(validateTrip(draft), /benenne/);
  draft.stops[1].name = 'Paris';
  draft.stops[1].latitude = 91;
  assert.match(validateTrip(draft), /Standorte/);
});
test('Ein Tagebucheintrag ausserhalb des Reisezeitraums wird abgewiesen', () => {
  const draft = trip();
  draft.stops[0].entries[0].date = '2026-08-01';
  assert.match(validateTrip(draft), /Reisezeitraum/);
});
test('Leere Einträge werden abgewiesen; eine reine Fotoerinnerung ist möglich', () => {
  const draft = trip();
  draft.stops[0].entries[0].text = '';
  assert.equal(validateTrip(draft), null);
  draft.stops[0].entries[0].photos = [];
  assert.match(validateTrip(draft), /Titel und Text/);
});
test('Suche berücksichtigt Standort und Tagebuchtext und kombiniert Filter', () => {
  const items = [trip()];
  assert.equal(filterTrips(items, 'PARIS', 'Alle').length, 1);
  assert.equal(filterTrips(items, 'Aare', 'Sommer').length, 1);
  assert.equal(filterTrips(items, 'Aare', '2025').length, 0);
  assert.equal(filterTrips(items, 'nichts', 'Alle').length, 0);
});
test('Fotos werden über mehrere Standorte und Einträge gesammelt', () => {
  const draft = trip();
  draft.stops[1].entries.push({
    id: 'e2',
    title: 'Tag 2',
    date: '2026-07-13',
    text: 'Paris',
    photos: ['bild2', 'bild3'],
  });
  assert.deepEqual(tripPhotos(draft), ['bild1', 'bild2', 'bild3']);
});

// Beim Aufbereiten dürfen weder andere Einträge noch der Entwurf verloren gehen.
test('Neue Reise übernimmt das Startdatum und lässt leere optionale Notizen weg', () => {
  const draft = trip();
  draft.title = '  Sommerreise  ';
  draft.stops[0].name = '  Bern  ';
  draft.stops[0].entries[0].title = 'Meine Erinnerung';
  draft.stops[1].entries.push({
    id: 'leer',
    title: 'Meine Erinnerung',
    date: '2026-07-12',
    text: ' ',
    photos: [],
  });
  const original = structuredClone(draft);
  const prepared = prepareTrip(draft, '2026-07-13', '2026-07-19', true);
  assert.equal(prepared.title, 'Sommerreise');
  assert.equal(prepared.stops[0].name, 'Bern');
  assert.equal(prepared.stops[0].entries[0].title, 'Sommerreise');
  assert.equal(prepared.stops[0].entries[0].date, '2026-07-13');
  assert.equal(prepared.stops[1].entries.length, 0);
  assert.equal(validateTrip(prepared), null);
  assert.deepEqual(draft, original);
});

test('Bearbeiten erhält mehrere Standorte, individuelle Einträge und reine Fotoerinnerungen', () => {
  const draft = trip();
  draft.stops[1].entries.push({
    id: 'foto',
    title: 'Eiffelturm',
    date: '2026-07-14',
    text: '',
    photos: ['paris'],
  });
  const original = structuredClone(draft);
  const prepared = prepareTrip(draft, '2026-07-11', '2026-07-20', false);
  assert.equal(prepared.stops.length, 2);
  assert.deepEqual(prepared.stops[0].entries, draft.stops[0].entries);
  assert.deepEqual(prepared.stops[1].entries, draft.stops[1].entries);
  assert.equal(validateTrip(prepared), null);
  assert.deepEqual(draft, original);
});
