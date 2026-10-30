import type { Stop } from '../types/trip';

export type Coordinates = { latitude: number; longitude: number };
export type CurrentPlace = Coordinates & { name: string };

// Haversine berechnet die Luftlinie zwischen zwei Koordinaten auf der Erdkugel.
export function distanceInMeters(a: Coordinates, b: Coordinates): number {
  const radians = Math.PI / 180;
  const latitudeDifference = (b.latitude - a.latitude) * radians;
  const longitudeDifference = (b.longitude - a.longitude) * radians;
  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(a.latitude * radians) *
      Math.cos(b.latitude * radians) *
      Math.sin(longitudeDifference / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, value)));
}

// Nur nahe Orte wählen, nicht einen Reiseort auf einem anderen Kontinent.
export function findNearbyStop(stops: Stop[], position: Coordinates): Stop | undefined {
  let nearest: Stop | undefined;
  let nearestDistance = 1000; // Maximal 1 km. Die Auswahl kann man danach korrigieren.
  for (const stop of stops) {
    const distance = distanceInMeters(position, stop);
    if (distance <= nearestDistance) {
      nearest = stop;
      nearestDistance = distance;
    }
  }
  return nearest;
}
