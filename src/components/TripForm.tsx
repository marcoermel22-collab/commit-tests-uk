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
import { router } from 'expo-router';
import { createId, emptyStop, emptyTrip, type Trip } from '../types/trip';
import { useTrips } from '../state/TripContext';
import { inputDate, parseDate, prepareTrip, validateTrip } from '../lib/trip-utils';
import { colors, shared } from '../lib/theme';
import { Screen, Button, Icon, showError, confirmDelete } from './UI';
import TripMap from './TripMap';
import LocationButton from './LocationButton';
import { PhotoButtons, PhotoGrid } from './Photos';

type Props = { original?: Trip; initialStopId?: string; initialEntryId?: string };

export default function TripForm({ original, initialStopId, initialEntryId }: Props) {
  // Eine Kopie bearbeiten: Abbrechen darf die gespeicherte Reise nicht verändern.
  const [draft, setDraft] = useState<Trip>(() =>
    original ? JSON.parse(JSON.stringify(original)) : emptyTrip(),
  );
  const [stopId, setStopId] = useState(initialStopId ?? draft.stops[0].id);
  const [date, setDate] = useState(inputDate(draft.startDate));
  const [endDate, setEndDate] = useState(inputDate(draft.endDate));
  const [routeOpen, setRouteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { saveTrip, deleteTrip } = useTrips();
  const stop = draft.stops.find((item) => item.id === stopId) ?? draft.stops[0];
  const selectedEntry =
    stop.entries.find((entry) => entry.id === initialEntryId) ?? stop.entries[0];

  // Nur den betroffenen Standort ersetzen; alle anderen bleiben erhalten.
  // Eine ID als zweites Argument erlaubt dieselbe Funktion auch in der Standortliste.
  function updateStop(changes: Partial<typeof stop>, id = stop.id) {
    setDraft((current) => ({
      ...current,
      stops: current.stops.map((item) =>
        item.id === id ? { ...item, ...changes } : item,
      ),
    }));
  }

  // Text und Fotos gehören zum ausgewählten Eintrag des ausgewählten Standorts.
  function updateEntry(changes: { text?: string; photos?: string[] }) {
    const entry = selectedEntry ?? {
      id: createId(),
      title: draft.title || 'Meine Erinnerung',
      date: draft.startDate,
      text: '',
      photos: [],
    };
    updateStop({
      entries: [
        { ...entry, ...changes },
        ...stop.entries.filter((item) => item.id !== entry.id),
      ],
    });
  }

  async function save() {
    if (saving) return;
    const start = parseDate(date);
    const end = parseDate(endDate);
    if (!start || !end)
      return showError(
        'Bitte gib gültige Daten im Format TT.MM.JJJJ ein. Das Reiseende findest du unter Reiseverlauf.',
      );
    // Eingaben aufbereiten und prüfen, bevor die Datenbank verändert wird.
    const next = prepareTrip(draft, start, end, !original);
    const error = validateTrip(next);
    if (error) {
      if (next.stops.some((item) => !item.name)) setRouteOpen(true);
      return showError(error);
    }
    setSaving(true);
    try {
      await saveTrip(next);
      router.replace({
        pathname: '/trip/[id]',
        params: { id: next.id, stopId: stop.id },
      });
    } catch {
      showError(
        'Die Reise konnte nicht gespeichert werden. Bitte prüfe den freien Gerätespeicher und versuche es erneut.',
      );
    } finally {
      setSaving(false);
    }
  }

  function moveStop(index: number, direction: number) {
    const next = index + direction;
    if (next < 0 || next >= draft.stops.length) return;
    setDraft((current) => {
      const stops = [...current.stops];
      [stops[index], stops[next]] = [stops[next], stops[index]];
      return { ...current, stops };
    });
  }

  return (
    <Screen tab={original ? undefined : 'new'}>
      {original ? (
        <View style={styles.editHeader}>
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text style={shared.small}>Abbrechen</Text>
          </Pressable>
          <Text style={styles.editTitle}>Reise bearbeiten</Text>
          <View style={{ width: 55 }} />
        </View>
      ) : (
        <>
          <Text style={shared.eyebrow}>NEUER EINTRAG</Text>
          <Text style={shared.title}>Reise festhalten</Text>
        </>
      )}
      <Text style={shared.label}>TITEL DER REISE *</Text>
      <TextInput
        accessibilityLabel="Titel der Reise"
        value={draft.title}
        onChangeText={(title) => setDraft((current) => ({ ...current, title }))}
        placeholder="z. B. Sommer in Bern"
        placeholderTextColor="#9DA2AF"
        style={shared.input}
        maxLength={100}
      />
      <View style={shared.row}>
        <View style={{ flex: 1 }}>
          <Text style={shared.label}>ORT *</Text>
          <TextInput
            accessibilityLabel="Ort"
            value={stop.name}
            onChangeText={(name) => updateStop({ name })}
            placeholder="Bern"
            style={shared.input}
            placeholderTextColor="#9DA2AF"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={shared.label}>DATUM *</Text>
          <TextInput
            accessibilityLabel="Startdatum"
            value={date}
            onChangeText={(value) => {
              if (endDate === date) setEndDate(value);
              setDate(value);
            }}
            placeholder="TT.MM.JJJJ"
            style={shared.input}
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>
      <LocationButton
        key={stop.id}
        disabled={saving}
        onSelect={(place) => updateStop(place)}
      />
      <Text style={shared.label}>KURZER TEXT / NOTIZ</Text>
      <TextInput
        accessibilityLabel="Kurzer Text oder Notiz"
        value={selectedEntry?.text ?? ''}
        onChangeText={(text) => updateEntry({ text })}
        placeholder="Was hast du erlebt? (Optional)"
        placeholderTextColor="#9DA2AF"
        style={[shared.input, styles.textarea]}
        multiline
        textAlignVertical="top"
      />
      <Text style={shared.label}>
        {original ? 'KARTEN-PIN ANPASSEN (ANTIPPEN)' : 'ORT AUF KARTE ANTIPPEN *'}
      </Text>
      <TripMap
        stops={[stop]}
        selectedId={stop.id}
        editable
        onPick={(latitude, longitude) => updateStop({ latitude, longitude })}
        height={155}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => setRouteOpen(true)}
        style={styles.routeButton}
      >
        <Icon name="git-branch-outline" size={17} color="#5C6A61" />
        <Text style={styles.routeText}>
          Reiseverlauf · {draft.stops.length} Standorte
        </Text>
        <Icon name="chevron-forward" size={16} color="#5C6A61" />
      </Pressable>
      <Text style={shared.label}>
        {original
          ? `FOTOS VERWALTEN (${selectedEntry?.photos.length ?? 0} GESPEICHERT)`
          : 'FOTOS HINZUFÜGEN (SPECIAL FEATURE)'}
      </Text>
      <PhotoGrid
        photos={selectedEntry?.photos ?? []}
        onRemove={(uri) =>
          updateEntry({
            photos: (selectedEntry?.photos ?? []).filter((photo) => photo !== uri),
          })
        }
      />
      <PhotoButtons
        onAdd={(photos) => {
          if (photos.length)
            updateEntry({ photos: [...(selectedEntry?.photos ?? []), ...photos] });
        }}
      />
      <Button
        title={original ? 'Änderungen speichern' : 'Reise speichern'}
        onPress={() => void save()}
        loading={saving}
        style={{ marginTop: 23 }}
      />
      {original && (
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => {
            // Bestätigung und Speichern werden getrennt, damit Löschen nie versehentlich passiert.
            confirmDelete(
              'Die Reise mit allen Standorten, Einträgen und Fotos endgültig löschen?',
              () => {
                void deleteTrip(original.id)
                  .then(() => router.replace('/'))
                  .catch(() => showError('Die Reise konnte nicht gelöscht werden.'));
              },
            );
          }}
          style={{ alignItems: 'center', padding: 22 }}
        >
          <Text style={{ fontSize: 12, color: '#777B83' }}>Reise endgültig löschen</Text>
        </Pressable>
      )}

      <Modal
        visible={routeOpen}
        animationType="slide"
        onRequestClose={() => setRouteOpen(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reiseverlauf</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setRouteOpen(false)}
              accessibilityLabel="Reiseverlauf schliessen"
              style={{ padding: 8 }}
            >
              <Icon name="close" size={24} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={{ padding: 22, paddingTop: 0, gap: 14 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={shared.small}>
              Benenne Startpunkt, Zwischenstopps und Endpunkt. Wähle einen Standort aus,
              um seinen Kartenmarker im Formular anzupassen.
            </Text>
            <Text style={shared.label}>REISEENDE *</Text>
            <TextInput
              accessibilityLabel="Enddatum"
              value={endDate}
              onChangeText={setEndDate}
              placeholder="TT.MM.JJJJ"
              style={shared.input}
            />
            {draft.stops.map((item, index) => (
              <View
                key={item.id}
                style={[styles.stopCard, item.id === stop.id && styles.selectedStop]}
              >
                <Text style={styles.stopRole}>
                  {index === 0
                    ? 'STARTPUNKT'
                    : index === draft.stops.length - 1
                      ? 'ENDPUNKT'
                      : `ZWISCHENSTOPP ${index}`}
                </Text>
                <TextInput
                  accessibilityLabel={`Standort ${index + 1}`}
                  value={item.name}
                  onChangeText={(name) => updateStop({ name }, item.id)}
                  placeholder="Name des Ortes"
                  style={[shared.input, { marginTop: 8 }]}
                />
                <View style={styles.stopActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setStopId(item.id);
                      setRouteOpen(false);
                    }}
                  >
                    <Text style={styles.routeText}>Auf Karte wählen</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Standort ${index + 1} nach oben`}
                    disabled={index === 0}
                    onPress={() => moveStop(index, -1)}
                    style={{ padding: 8, opacity: index === 0 ? 0.25 : 1 }}
                  >
                    <Icon name="arrow-up" size={18} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Standort ${index + 1} nach unten`}
                    disabled={index === draft.stops.length - 1}
                    onPress={() => moveStop(index, 1)}
                    style={{
                      padding: 8,
                      opacity: index === draft.stops.length - 1 ? 0.25 : 1,
                    }}
                  >
                    <Icon name="arrow-down" size={18} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Standort ${index + 1} entfernen`}
                    disabled={draft.stops.length <= 2}
                    onPress={() => {
                      confirmDelete(
                        'Diesen Standort mit seinen Tagebucheinträgen entfernen? Die Änderung wird erst beim Speichern übernommen.',
                        () => {
                          setDraft((current) => ({
                            ...current,
                            stops: current.stops.filter((s) => s.id !== item.id),
                          }));
                          if (stop.id === item.id)
                            setStopId(draft.stops.find((s) => s.id !== item.id)!.id);
                        },
                      );
                    }}
                    style={{ padding: 8, opacity: draft.stops.length <= 2 ? 0.25 : 1 }}
                  >
                    <Icon name="trash-outline" size={18} />
                  </Pressable>
                </View>
              </View>
            ))}
            <Button
              title="+ Zwischenstopp hinzufügen"
              secondary
              onPress={() =>
                setDraft((current) => ({
                  ...current,
                  stops: [
                    ...current.stops.slice(0, -1),
                    emptyStop(),
                    current.stops[current.stops.length - 1],
                  ],
                }))
              }
            />
            <Text style={shared.label}>KATEGORIE (OPTIONAL)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {['Sommer', 'Winter', 'Meer', 'Ausflug'].map((tag) => (
                <Pressable
                  accessibilityRole="button"
                  key={tag}
                  onPress={() =>
                    setDraft((current) => ({
                      ...current,
                      tag: current.tag === tag ? '' : tag,
                    }))
                  }
                  style={{
                    padding: 10,
                    borderRadius: 20,
                    backgroundColor: draft.tag === tag ? colors.dark : 'white',
                  }}
                >
                  <Text style={{ color: draft.tag === tag ? 'white' : colors.text }}>
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button title="Reiseverlauf übernehmen" onPress={() => setRouteOpen(false)} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}
const styles = StyleSheet.create({
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },
  editTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  textarea: { minHeight: 100, paddingTop: 15 },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 12,
  },
  routeText: { fontSize: 12, fontWeight: '600', color: '#5C6A61', flex: 1 },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  stopCard: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedStop: { borderColor: '#6A7D6D' },
  stopRole: { fontSize: 10, color: '#647267', fontWeight: '700' },
  stopActions: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
});
