import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  BackHeader,
  Button,
  EmptyState,
  Icon,
  Screen,
  confirmDelete,
  showError,
} from '../../components/UI';
import TripMap from '../../components/TripMap';
import { PhotoGrid } from '../../components/Photos';
import EntryEditor from '../../components/EntryEditor';
import { useTrips } from '../../state/TripContext';
import { displayDate } from '../../lib/trip-utils';
import { colors, shared } from '../../lib/theme';
import type { DiaryEntry } from '../../types/trip';

export default function DetailScreen() {
  const { id, stopId: requestedStop } = useLocalSearchParams<{
    id: string;
    stopId?: string;
  }>();
  const { trips, saveTrip, deleteTrip } = useTrips();
  const [stopId, setStopId] = useState(requestedStop);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ entry?: DiaryEntry } | null>(null);
  const [busy, setBusy] = useState(false);
  const trip = trips.find((item) => item.id === id);
  if (!trip)
    return (
      <Screen>
        <BackHeader />
        <EmptyState
          title="Reise nicht gefunden"
          text="Diese Reise wurde möglicherweise gelöscht."
        />
      </Screen>
    );
  const stop = trip.stops.find((item) => item.id === stopId) ?? trip.stops[0];
  const sortedEntries = [...stop.entries].sort((a, b) => a.date.localeCompare(b.date));
  const entry = sortedEntries.find((item) => item.id === entryId) ?? sortedEntries[0];

  async function removeEntry() {
    if (!trip || !entry || busy) return;
    setBusy(true);
    try {
      await saveTrip({
        ...trip,
        stops: trip.stops.map((item) => ({
          ...item,
          entries: item.entries.filter((e) => e.id !== entry.id),
        })),
      });
      setEntryId(null);
    } catch {
      showError('Der Eintrag konnte nicht gelöscht werden.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackHeader
        action={
          <Text style={styles.dateBadge}>
            {displayDate(entry?.date ?? trip.startDate)}
          </Text>
        }
      />
      <TripMap
        stops={trip.stops}
        selectedId={stop.id}
        height={145}
        onSelect={(id) => {
          setStopId(id);
          setEntryId(null);
        }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stopList}
      >
        {trip.stops.map((item, index) => (
          <Pressable
            accessibilityRole="button"
            key={item.id}
            onPress={() => {
              setStopId(item.id);
              setEntryId(null);
            }}
            style={[styles.stop, stop.id === item.id && styles.activeStop]}
          >
            <Text
              style={{ fontSize: 11, color: stop.id === item.id ? 'white' : '#626C65' }}
            >
              {index + 1} · {item.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.diaryHeader}>
        <Text style={styles.label}>TAGEBUCH-EINTRAG</Text>
        <Pressable accessibilityRole="button" onPress={() => setEditor({})}>
          <Text style={styles.addEntry}>+ Eintrag hinzufügen</Text>
        </Pressable>
      </View>
      {sortedEntries.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 7, paddingVertical: 9 }}
        >
          {sortedEntries.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.id}
              onPress={() => setEntryId(item.id)}
              style={[
                styles.entryChip,
                item.id === entry?.id && { borderColor: '#7D8981' },
              ]}
            >
              <Text style={{ fontSize: 11, color: colors.text }}>
                {displayDate(item.date)} · {item.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      {entry ? (
        <View style={styles.note}>
          <Text style={styles.noteText}>
            {entry.text || 'Zu diesem Eintrag wurde kein Text erfasst.'}
          </Text>
          <View style={styles.noteActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tagebucheintrag bearbeiten"
              onPress={() => setEditor({ entry })}
            >
              <Icon name="create-outline" size={17} color="#7C8580" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              accessibilityLabel="Tagebucheintrag löschen"
              onPress={() =>
                confirmDelete(
                  'Diesen Tagebucheintrag mit seinen Fotos löschen?',
                  () => void removeEntry(),
                )
              }
            >
              <Icon name="trash-outline" size={17} color="#7C8580" />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.note}>
          <Text style={shared.small}>
            Für diesen Standort gibt es noch keinen Eintrag. Halte dein erstes Erlebnis
            fest.
          </Text>
        </View>
      )}
      <View style={styles.divider} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Icon name="location" size={10} color="#7D8981" />
        <Text style={styles.label}>{stop.name.toLocaleUpperCase('de')}</Text>
      </View>
      <Text style={styles.detailTitle}>{entry?.title ?? trip.title}</Text>
      <PhotoGrid photos={entry?.photos ?? []} />
      {!!entry && !entry.photos.length && (
        <Text style={[shared.small, { paddingVertical: 20 }]}>
          Noch keine Fotos. Über die Bearbeitung kannst du Bilder hinzufügen.
        </Text>
      )}
      <View style={[shared.row, { marginTop: 12 }]}>
        <Button
          title="Reise bearbeiten"
          onPress={() =>
            router.push({
              pathname: '/trip/edit',
              params: { id: trip.id, stopId: stop.id, entryId: entry?.id },
            })
          }
          style={{ flex: 2 }}
        />
        <Button
          title="Löschen"
          secondary
          loading={busy}
          onPress={() =>
            confirmDelete(
              'Diese Reise mit allen Standorten, Einträgen und Fotos endgültig löschen?',
              () => {
                setBusy(true);
                void deleteTrip(trip.id)
                  .then(() => router.replace('/'))
                  .catch(() => {
                    setBusy(false);
                    showError('Die Reise konnte nicht gelöscht werden.');
                  });
              },
            )
          }
          style={{ flex: 1, paddingHorizontal: 10 }}
        />
      </View>
      {editor && (
        <EntryEditor
          trip={trip}
          stopId={stop.id}
          entry={editor.entry}
          onClose={() => setEditor(null)}
          onSaved={(newId, newStopId) => {
            setEntryId(newId);
            setStopId(newStopId);
          }}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  dateBadge: {
    color: 'white',
    backgroundColor: colors.green,
    fontSize: 11,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 18,
  },
  stopList: { gap: 6, paddingVertical: 12 },
  stop: {
    backgroundColor: '#EAEDE7',
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  activeStop: { backgroundColor: colors.green },
  diaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 10,
  },
  label: { fontSize: 10, color: '#7C8384', fontWeight: '600' },
  addEntry: { color: '#526457', fontWeight: '600', fontSize: 11 },
  note: { paddingVertical: 12, minHeight: 70 },
  noteText: { color: '#666C77', fontSize: 14, lineHeight: 21 },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 22,
    paddingTop: 10,
  },
  entryChip: {
    borderRadius: 15,
    backgroundColor: 'white',
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: { height: 1, backgroundColor: '#CCCFC8', marginTop: 6, marginBottom: 8 },
  detailTitle: { fontSize: 25, fontWeight: '800', color: '#1C1D20', marginTop: 4 },
});
