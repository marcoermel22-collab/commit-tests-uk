import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createId, todayISO, type DiaryEntry, type Trip, type Stop } from '../types/trip';
import { useTrips } from '../state/TripContext';
import { inputDate, parseDate, validateTrip } from '../lib/trip-utils';
import { colors, shared } from '../lib/theme';
import { Button, Icon, showError } from './UI';
import { PhotoGrid, PhotoButtons } from './Photos';
import LocationButton from './LocationButton';
import { findNearbyStop, type CurrentPlace } from '../lib/location-utils';

type Props = {
  trip: Trip;
  stopId: string;
  entry?: DiaryEntry;
  onClose: () => void;
  onSaved: (entryId: string, stopId: string) => void;
};
export default function EntryEditor({ trip, stopId, entry, onClose, onSaved }: Props) {
  const { saveTrip } = useTrips();
  const [draft, setDraft] = useState<DiaryEntry>(() =>
    entry
      ? { ...entry, photos: [...entry.photos] }
      : { id: createId(), title: '', date: todayISO(), text: '', photos: [] },
  );
  const [date, setDate] = useState(inputDate(draft.date));
  const [selectedStop, setSelectedStop] = useState(stopId);
  const [saving, setSaving] = useState(false);
  const [newStop, setNewStop] = useState<Stop | null>(null);
  const [locationNotice, setLocationNotice] = useState('');
  // Ein neuer GPS-Ort wird vor dem Endpunkt eingefügt. Start und Ende bleiben erhalten.
  const stops = newStop
    ? [...trip.stops.slice(0, -1), newStop, trip.stops[trip.stops.length - 1]]
    : trip.stops;

  function applyCurrentPlace(place: CurrentPlace) {
    const nearby = findNearbyStop(trip.stops, place);
    if (nearby) {
      setNewStop(null);
      setSelectedStop(nearby.id);
      setLocationNotice(
        `Reiseort in der Nähe ausgewählt: ${nearby.name}. Du kannst die Auswahl ändern.`,
      );
    } else {
      // Der neue Standort gehört nur zum Entwurf und wird erst mit dem Eintrag gespeichert.
      const stop: Stop = { ...place, id: createId(), entries: [] };
      setNewStop(stop);
      setSelectedStop(stop.id);
      setLocationNotice(
        `Neuer Zwischenstopp: ${place.name}. Wird mit dem Eintrag gespeichert.`,
      );
    }
  }

  async function save() {
    if (saving) return;
    const iso = parseDate(date);
    if (!iso) return showError('Bitte gib ein gültiges Datum im Format TT.MM.JJJJ ein.');
    if (!draft.title.trim() || !draft.text.trim())
      return showError('Bitte ergänze den Titel und deinen Tagebuchtext.');
    const nextEntry = {
      ...draft,
      title: draft.title.trim(),
      text: draft.text.trim(),
      date: iso,
    };
    const updated: Trip = {
      ...trip,
      stops: stops.map((stop) => {
        // Den alten Eintrag entfernen, auch wenn sein Standort geändert wurde.
        const entries = stop.entries.filter((item) => item.id !== draft.id);
        if (stop.id === selectedStop) entries.push(nextEntry);
        return { ...stop, entries };
      }),
    };
    const error = validateTrip(updated);
    if (error) return showError(error);
    setSaving(true);
    try {
      await saveTrip(updated);
      onSaved(nextEntry.id, selectedStop);
      onClose();
    } catch {
      showError('Der Eintrag konnte nicht gespeichert werden. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {entry ? 'Eintrag bearbeiten' : 'Neuer Tagebucheintrag'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Eintrag schliessen"
            disabled={saving}
            onPress={onClose}
            style={{ padding: 8 }}
          >
            <Icon name="close" size={24} />
          </Pressable>
        </View>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 22, paddingTop: 0, paddingBottom: 45 }}
        >
          <Text style={shared.label}>TITEL *</Text>
          <TextInput
            accessibilityLabel="Titel des Tagebucheintrags"
            value={draft.title}
            onChangeText={(title) => setDraft((d) => ({ ...d, title }))}
            style={shared.input}
            placeholder="Unser erster Abend"
          />
          <Text style={shared.label}>DATUM *</Text>
          <TextInput
            accessibilityLabel="Datum des Tagebucheintrags"
            value={date}
            onChangeText={setDate}
            style={shared.input}
            placeholder="TT.MM.JJJJ"
          />
          <Text style={shared.label}>STANDORT *</Text>
          <View style={styles.stops}>
            {stops.map((stop) => (
              <Pressable
                accessibilityRole="button"
                key={stop.id}
                accessibilityState={{ selected: selectedStop === stop.id }}
                onPress={() => {
                  setSelectedStop(stop.id);
                  setLocationNotice('');
                  // Ein nicht gewählter neuer GPS-Ort soll nicht versehentlich gespeichert werden.
                  if (stop.id !== newStop?.id) setNewStop(null);
                }}
                style={[styles.stop, selectedStop === stop.id && styles.selectedStop]}
              >
                <Text
                  style={{
                    color: selectedStop === stop.id ? 'white' : colors.text,
                    fontSize: 13,
                  }}
                >
                  {stop.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <LocationButton disabled={saving} onSelect={applyCurrentPlace} />
          {locationNotice ? (
            <Text style={[shared.small, { marginTop: 8 }]}>{locationNotice}</Text>
          ) : null}
          <Text style={shared.label}>TAGEBUCHTEXT *</Text>
          <TextInput
            accessibilityLabel="Tagebuchtext"
            value={draft.text}
            onChangeText={(text) => setDraft((d) => ({ ...d, text }))}
            style={[shared.input, { minHeight: 145, textAlignVertical: 'top' }]}
            multiline
            placeholder="Was hast du erlebt?"
          />
          <Text style={shared.label}>FOTOS (OPTIONAL)</Text>
          <PhotoGrid
            photos={draft.photos}
            onRemove={(uri) =>
              setDraft((d) => ({ ...d, photos: d.photos.filter((p) => p !== uri) }))
            }
          />
          <PhotoButtons
            onAdd={(photos) =>
              setDraft((d) => ({ ...d, photos: [...d.photos, ...photos] }))
            }
          />
          <Button
            title="Eintrag speichern"
            loading={saving}
            onPress={() => void save()}
            style={{ marginTop: 24 }}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 21, fontWeight: '700', color: colors.text, flex: 1 },
  stops: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stop: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedStop: { backgroundColor: colors.dark, borderColor: colors.dark },
});
