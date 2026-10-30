import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceInMeters, findNearbyStop } from '../src/lib/location-utils.ts';

const bern = { latitude: 46.948, longitude: 7.4474 };
const paris = { latitude: 48.8566, longitude: 2.3522 };
function stop(id, coordinates) {
  return { id, name: id, ...coordinates, entries: [] };
}

test('Gleiche Koordinaten haben Abstand null; Luftlinie ist symmetrisch', () => {
  assert.equal(distanceInMeters(bern, bern), 0);
  assert.ok(distanceInMeters(bern, paris) > 400000);
  assert.equal(distanceInMeters(bern, paris), distanceInMeters(paris, bern));
});

test('Entfernung berücksichtigt den Übergang zwischen +180 und -180 Grad', () => {
  const distance = distanceInMeters(
    { latitude: 0, longitude: 179.9 },
    { latitude: 0, longitude: -179.9 },
  );
  assert.ok(distance > 22000 && distance < 23000);
});

test('Der nächste Reiseort innerhalb eines Kilometers wird gewählt', () => {
  const stops = [
    stop('weiter', { ...bern, latitude: bern.latitude + 0.005 }),
    stop('Bern', bern),
    stop('Paris', paris),
  ];
  assert.equal(
    findNearbyStop(stops, { ...bern, latitude: bern.latitude + 0.0001 })?.id,
    'Bern',
  );
});

test('Ein entfernter Reiseort wird nicht als aktuelle Position vorgeschlagen', () => {
  assert.equal(findNearbyStop([stop('Paris', paris)], bern), undefined);
  assert.equal(findNearbyStop([], bern), undefined);
});

test('Die Näheprüfung verändert keine gespeicherten Standorte', () => {
  const stops = [stop('Bern', bern), stop('Paris', paris)];
  const original = structuredClone(stops);
  findNearbyStop(stops, bern);
  assert.deepEqual(stops, original);
});
