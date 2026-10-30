import type { Trip } from '../types/trip';
import { demoTrips } from './demo';

// Nur für die Browser-Vorschau: Auf iOS/Android wird database.ts mit SQLite verwendet.
const key = 'pinmap-plan19-trips';
export async function loadTrips(): Promise<Trip[]> {
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved) as Trip[];
  localStorage.setItem(key, JSON.stringify(demoTrips));
  return JSON.parse(JSON.stringify(demoTrips));
}
export async function writeTrip(trip: Trip) {
  const trips = await loadTrips();
  localStorage.setItem(
    key,
    JSON.stringify([...trips.filter((item) => item.id !== trip.id), trip]),
  );
}
export async function removeTrip(id: string) {
  const trips = await loadTrips();
  localStorage.setItem(key, JSON.stringify(trips.filter((trip) => trip.id !== id)));
}
