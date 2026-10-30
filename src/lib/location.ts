import * as Location from 'expo-location';
import { Platform } from 'react-native';
import type { CurrentPlace } from './location-utils';

// Verhindert endloses Warten bei fehlendem GPS-Empfang oder einer langsamen Ortssuche.
async function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Zeitüberschreitung')), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function getCurrentPlace(): Promise<CurrentPlace> {
  // Die Freigabe wird erst nach einem bewussten Tippen auf den Standortbutton angefragt.
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      'Der Standortzugriff ist nicht erlaubt. Du kannst ihn in den Einstellungen freigeben oder den Ort selbst auswählen.',
    );
  if (!(await Location.hasServicesEnabledAsync()))
    throw new Error('Bitte aktiviere die Ortungsdienste oder wähle den Ort selbst aus.');

  let position;
  try {
    // Eine einzelne Messung. Keine Hintergrundortung und keine laufende Aufzeichnung.
    position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      20000,
    );
  } catch {
    throw new Error(
      'Deine Position konnte nicht ermittelt werden. Versuche es erneut oder wähle den Ort selbst aus.',
    );
  }
  const { latitude, longitude } = position.coords;
  let name = 'Aktueller Standort';
  if (Platform.OS !== 'web') {
    try {
      // Das Betriebssystem sucht zu den Koordinaten den Ortsnamen. Internet kann nötig sein.
      const [address] = await withTimeout(
        Location.reverseGeocodeAsync({ latitude, longitude }),
        4000,
      );
      name = address?.city || address?.district || address?.name || name;
    } catch {
      // Ohne Ortsnamen bleiben die ermittelten Koordinaten trotzdem verwendbar.
    }
  }
  return { latitude, longitude, name };
}
