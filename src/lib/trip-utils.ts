import type { Trip } from '../types/trip';

// Im Formular steht TT.MM.JJJJ, gespeichert wird YYYY-MM-DD.
export function parseDate(input: string): string | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(input.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  // JavaScript würde den 31. April in den Mai verschieben. Das lehnen wir ab.
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  )
    return null;
  return `${year}-${month}-${day}`;
}

export function inputDate(iso: string) {
  const [year, month, day] = iso.split('-');
  return `${day}.${month}.${year}`;
}

export function displayDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function validateTrip(trip: Trip): string | null {
  // Beim ersten Fehler abbrechen. null bedeutet: Alle Prüfungen sind bestanden.
  if (!trip.title.trim()) return 'Bitte gib einen Titel für die Reise ein.';
  if (!parseDate(inputDate(trip.startDate)) || !parseDate(inputDate(trip.endDate)))
    return 'Bitte gib gültige Daten ein (TT.MM.JJJJ).';
  if (trip.endDate < trip.startDate)
    return 'Das Enddatum darf nicht vor dem Startdatum liegen.';
  if (trip.stops.length < 2) return 'Bitte erfasse einen Startpunkt und einen Endpunkt.';
  for (const stop of trip.stops) {
    if (!stop.name.trim()) return 'Bitte benenne alle Standorte im Reiseverlauf.';
  }
  for (const stop of trip.stops) {
    if (
      !Number.isFinite(stop.latitude) ||
      !Number.isFinite(stop.longitude) ||
      Math.abs(stop.latitude) > 90 ||
      Math.abs(stop.longitude) > 180
    )
      return 'Bitte gib gültige Koordinaten für alle Standorte ein.';
  }

  // Einträge aller Standorte in einer Liste prüfen, ohne verschachtelte Prüfungen.
  const entries = trip.stops.flatMap((stop) => stop.entries);
  for (const entry of entries) {
    if (!entry.title.trim() || (!entry.text.trim() && !entry.photos.length))
      return 'Bitte ergänze Titel und Text aller Tagebucheinträge.';
  }
  for (const entry of entries) {
    if (
      !parseDate(inputDate(entry.date)) ||
      entry.date < trip.startDate ||
      entry.date > trip.endDate
    )
      return 'Die Tagebucheinträge müssen innerhalb des Reisezeitraums liegen.';
  }
  return null;
}

// Bereitet Formulareingaben vor, ohne den Entwurf oder gespeicherte Daten zu ändern.
export function prepareTrip(
  draft: Trip,
  startDate: string,
  endDate: string,
  isNewTrip: boolean,
): Trip {
  const title = draft.title.trim();
  const stops = draft.stops.map((stop) => {
    const entries = [];
    for (const entry of stop.entries) {
      // Eine nicht ausgefüllte optionale Notiz wird nicht als Eintrag gespeichert.
      if (!entry.text.trim() && entry.photos.length === 0) continue;
      entries.push({
        ...entry,
        date: isNewTrip ? startDate : entry.date,
        title: entry.title === 'Meine Erinnerung' ? title : entry.title,
      });
    }
    return { ...stop, name: stop.name.trim(), entries };
  });
  return { ...draft, title, startDate, endDate, stops };
}

export function tripPhotos(trip: Trip): string[] {
  const photos: string[] = [];
  for (const stop of trip.stops) {
    for (const entry of stop.entries) {
      photos.push(...entry.photos);
    }
  }
  return photos;
}

export function filterTrips(trips: Trip[], query: string, filter: string): Trip[] {
  const search = query.trim().toLocaleLowerCase('de');
  return trips.filter((trip) => {
    const matchesFilter =
      filter === 'Alle' || trip.startDate.startsWith(filter) || trip.tag === filter;
    if (!matchesFilter) return false;

    // Nicht nur den Reisetitel durchsuchen, sondern auch Orte und Tagebuchtexte.
    const texts = [trip.title, trip.tag];
    for (const stop of trip.stops) {
      texts.push(stop.name);
      for (const entry of stop.entries) {
        texts.push(entry.title, entry.text);
      }
    }
    const searchableText = texts.join(' ').toLocaleLowerCase('de');
    return searchableText.includes(search);
  });
}
