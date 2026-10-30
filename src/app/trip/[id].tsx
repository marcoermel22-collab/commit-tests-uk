import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BackHeader, Button, confirmDelete, EmptyState, Screen, showError } from '../../components/UI';
import { useTrips } from '../../state/TripContext';
import { displayDate } from '../../lib/trip-utils';
import { shared } from '../../lib/theme';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trips, deleteTrip } = useTrips();
  const [deleting, setDeleting] = useState(false);
  const trip = trips.find((item) => item.id === id);
  if (!trip) return <Screen><BackHeader /><EmptyState title="Reise nicht gefunden" text="Die Reise ist nicht mehr vorhanden." /></Screen>;
  async function remove() {
    if (!trip || deleting) return;
    setDeleting(true);
    try { await deleteTrip(trip.id); router.replace('/'); }
    catch { showError('Die Reise konnte nicht geloescht werden.'); }
    finally { setDeleting(false); }
  }
  return <Screen>
    <BackHeader title="Deine Reise" />
    <Text style={shared.eyebrow}>{trip.tag || 'REISE'}</Text>
    <Text style={shared.title}>{trip.title}</Text>
    <Text style={styles.date}>{displayDate(trip.startDate)} – {displayDate(trip.endDate)}</Text>
    <View style={styles.summary}><Text style={styles.number}>{trip.stops.length}</Text><Text style={styles.summaryText}>Orte verbinden deine Reise</Text></View>
    <Text style={shared.label}>DEIN REISEVERLAUF</Text>
    {trip.stops.map((stop, index) => <View key={stop.id} style={styles.stop}><Text style={styles.position}>{index + 1}</Text><View style={{ flex: 1 }}><Text style={styles.name}>{stop.name}</Text><Text style={shared.small}>{stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}</Text></View></View>)}
    <Button title="Reise bearbeiten" onPress={() => router.push({ pathname: '/trip/edit', params: { id: trip.id } })} style={{ marginTop: 24 }} />
    <Button secondary title="Reise loeschen" loading={deleting} onPress={() => confirmDelete('Diese Reise dauerhaft loeschen?', () => void remove())} style={{ marginTop: 10 }} />
  </Screen>;
}
const styles = StyleSheet.create({
  date: { color: '#7B837D', fontSize: 14, marginTop: 12 },
  summary: { marginVertical: 28, padding: 25, backgroundColor: '#E9EEE3', borderRadius: 24, gap: 6 },
  number: { fontSize: 46, fontWeight: '800', color: '#4C6452' },
  summaryText: { color: '#53695B', fontSize: 15 },
  stop: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 18, marginTop: 10 },
  position: { backgroundColor: '#E9EEE3', borderRadius: 20, width: 36, height: 36, textAlign: 'center', lineHeight: 36, color: '#53695B', fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '600', marginBottom: 6, color: '#222A24' },
});
