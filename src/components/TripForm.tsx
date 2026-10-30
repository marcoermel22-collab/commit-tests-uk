import { PhotoButtons, PhotoGrid } from './Photos';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { createId, emptyStop, emptyTrip, type Trip, type Stop } from '../types/trip';
import { useTrips } from '../state/TripContext';
import { inputDate, parseDate, validateTrip } from '../lib/trip-utils';
import { shared } from '../lib/theme';
import { BackHeader, Button, Screen, showError } from './UI';

type Props = { original?: Trip; initialStopId?: string; initialEntryId?: string };
type CoordinateDraft = { latitude: string; longitude: string };

export default function TripForm({ original }: Props) {
  // Eine Kopie verhindert, dass Abbrechen die gespeicherte Reise aendert.
  const [draft, setDraft] = useState<Trip>(() =>
    original ? JSON.parse(JSON.stringify(original)) : emptyTrip(),
  );
  const [start, setStart] = useState(inputDate(draft.startDate));
  const [end, setEnd] = useState(inputDate(draft.endDate));
  const [saving, setSaving] = useState(false);
  // Text bleibt beim Tippen Text: So sind auch Minuszeichen und Dezimalzahlen moeglich.
  const [coordinates, setCoordinates] = useState<Record<string, CoordinateDraft>>(() =>
    Object.fromEntries(draft.stops.map((stop) => [stop.id, {
      latitude: original ? String(stop.latitude) : '',
      longitude: original ? String(stop.longitude) : '',
    }])),
  );
  const { saveTrip } = useTrips();

  function updateStop(id: string, changes: Partial<Stop>) {
    setDraft((current) => ({
      ...current,
      stops: current.stops.map((stop) =>
        stop.id === id ? { ...stop, ...changes } : stop,
      ),
    }));
  }
  function updateCoordinate(id: string, field: 'latitude' | 'longitude', value: string) {
    setCoordinates((current) => {
      const previous = current[id] ?? { latitude: '', longitude: '' };
      return { ...current, [id]: { ...previous, [field]: value } };
    });
  }
  function parseCoordinate(value: string | undefined) {
    return value?.trim() ? Number(value.replace(',', '.')) : NaN;
  }
  const photos = draft.stops[0].entries[0]?.photos ?? [];
  function updatePhotos(photos: string[]) {
    setDraft((current) => {
      const stop = current.stops[0];
      const entry = stop.entries[0] ?? { id: createId(), title: 'Meine Erinnerung', date: parseDate(start) ?? current.startDate, text: '', photos: [] };
      const entries = !photos.length && !entry.text.trim() ? stop.entries.slice(1) : [{ ...entry, photos }, ...stop.entries.slice(1)];
      return { ...current, stops: [{ ...stop, entries }, ...current.stops.slice(1)] };
    });
  }
  async function save() {
    if (saving) return;
    const startDate = parseDate(start);
    const endDate = parseDate(end);
    if (!startDate || !endDate)
      return showError('Bitte gueltige Daten im Format TT.MM.JJJJ eingeben.');
    const next: Trip = {
      ...draft,
      title: draft.title.trim(),
      tag: draft.tag.trim(),
      startDate,
      endDate,
      stops: draft.stops.map((stop) => ({
        ...stop,
        name: stop.name.trim(),
        entries: stop.entries.map((entry) => !original ? { ...entry, date: startDate, title: entry.title === 'Meine Erinnerung' ? draft.title.trim() : entry.title } : entry),
        latitude: parseCoordinate(coordinates[stop.id]?.latitude),
        longitude: parseCoordinate(coordinates[stop.id]?.longitude),
      })),
    };
    const error = validateTrip(next);
    if (error) return showError(error);
    setSaving(true);
    try {
      await saveTrip(next);
      router.replace({ pathname: '/trip/[id]', params: { id: next.id } });
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Die Reise konnte nicht gespeichert werden.');
    } finally { setSaving(false); }
  }
  return (
    <Screen tab={original ? undefined : 'new'}>
      <BackHeader title={original ? 'Reise bearbeiten' : 'Neue Reise'} />
      <Text style={shared.eyebrow}>DEIN NAECHSTES KAPITEL</Text>
      <Text style={shared.title}>{original ? 'Erinnerung anpassen' : 'Reise festhalten'}</Text>
      <Text style={shared.label}>TITEL *</Text>
      <TextInput accessibilityLabel="Titel der Reise" value={draft.title} onChangeText={(title) => setDraft((current) => ({ ...current, title }))} placeholder="z. B. Wochenende in Bern" style={shared.input} maxLength={100} />
      <Text style={shared.label}>STARTDATUM *</Text>
      <TextInput accessibilityLabel="Startdatum" value={start} onChangeText={setStart} placeholder="TT.MM.JJJJ" style={shared.input} />
      <Text style={shared.label}>ENDDATUM *</Text>
      <TextInput accessibilityLabel="Enddatum" value={end} onChangeText={setEnd} placeholder="TT.MM.JJJJ" style={shared.input} />
      <Text style={shared.label}>KATEGORIE</Text>
      <TextInput accessibilityLabel="Kategorie" value={draft.tag} onChangeText={(tag) => setDraft((current) => ({ ...current, tag }))} placeholder="z. B. Wochenende" style={shared.input} />
      <Text style={[shared.label, { marginTop: 28 }]}>REISEVERLAUF *</Text>
      <Text style={shared.small}>Mindestens Start und Ziel. Die Koordinaten kannst du manuell angeben.</Text>
      {draft.stops.map((stop, index) => <View key={stop.id} style={styles.stop}>
        <Text style={styles.stopTitle}>{index === 0 ? 'Start' : index === draft.stops.length - 1 ? 'Ziel' : `Zwischenstopp ${index}`}</Text>
        <Text style={shared.label}>ORT *</Text>
        <TextInput accessibilityLabel={`Ort ${index + 1}`} value={stop.name} onChangeText={(name) => updateStop(stop.id, { name })} placeholder="Ortsname" style={shared.input} />
        <Text style={shared.label}>BREITENGRAD *</Text>
        <TextInput accessibilityLabel={`Breitengrad ${index + 1}`} value={coordinates[stop.id]?.latitude ?? ''} onChangeText={(value) => updateCoordinate(stop.id, 'latitude', value)} placeholder="z. B. 46.9480" style={shared.input} />
        <Text style={shared.label}>LAENGENGRAD *</Text>
        <TextInput accessibilityLabel={`Laengengrad ${index + 1}`} value={coordinates[stop.id]?.longitude ?? ''} onChangeText={(value) => updateCoordinate(stop.id, 'longitude', value)} placeholder="z. B. 7.4474" style={shared.input} />
      </View>)}
      <Button secondary title="Zwischenstopp hinzufuegen" onPress={() => setDraft((current) => ({ ...current, stops: [...current.stops.slice(0, -1), emptyStop(), current.stops[current.stops.length - 1]] }))} />
<Text style={shared.label}>FOTOS</Text><PhotoGrid photos={photos} onRemove={(uri) => updatePhotos(photos.filter((photo) => photo !== uri))} /><PhotoButtons onAdd={(added) => updatePhotos([...photos, ...added])} />
      <Button title="Reise speichern" loading={saving} onPress={() => void save()} style={{ marginTop: 20 }} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  stop: { backgroundColor: '#EEF1E9', padding: 18, borderRadius: 22, marginVertical: 10 },
  stopTitle: { fontSize: 16, fontWeight: '700', color: '#53695B' },
});
