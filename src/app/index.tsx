import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button, EmptyState, Icon, Screen } from '../components/UI';
import { useTrips } from '../state/TripContext';
import { displayDate, filterTrips } from '../lib/trip-utils';
import { colors, shared } from '../lib/theme';

export default function TripsScreen() {
  const { trips } = useTrips();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Alle');
  const tags = ['Alle', ...new Set(trips.map((trip) => trip.tag).filter(Boolean))];
  const visible = filterTrips(trips, query, filter).sort((a, b) => b.startDate.localeCompare(a.startDate));
  return (
    <Screen tab="trips">
      <View style={styles.heading}>
        <View><Text style={shared.eyebrow}>MEINE ERINNERUNGEN</Text><Text style={shared.title}>Pin Map</Text></View>
        <Button title="+ Erfassen" onPress={() => router.push('/create')} />
      </View>
      <Text style={styles.intro}>Deine Reisen. Ort fuer Ort.</Text>
      <TextInput accessibilityLabel="Reisen durchsuchen" placeholder="Reisen, Orte oder Kategorien suchen" value={query} onChangeText={setQuery} style={shared.input} />
      <View style={styles.filters}>{tags.map((tag) => <Pressable key={tag} accessibilityRole="button" accessibilityState={{ selected: filter === tag }} onPress={() => setFilter(tag)} style={[styles.chip, filter === tag && styles.active]}><Text style={{ color: filter === tag ? 'white' : colors.text }}>{tag}</Text></Pressable>)}</View>
      <Text style={styles.count}>{visible.length} {visible.length === 1 ? 'Reise' : 'Reisen'}</Text>
      {visible.map((trip) => <Pressable key={trip.id} accessibilityRole="button" accessibilityLabel={`Reise oeffnen: ${trip.title}`} onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } })} style={styles.card}>
        <View style={styles.route}><Icon name="navigate-outline" color="#53695B" /><Text style={styles.routeText} numberOfLines={2}>{trip.stops.map((stop) => stop.name).join(' → ')}</Text></View>
        <Text style={styles.title}>{trip.title}</Text>
        <Text style={shared.small}>{displayDate(trip.startDate)} – {displayDate(trip.endDate)}</Text>
        <View style={styles.footer}><Text style={styles.badge}>{trip.tag || 'Reise'}</Text><Text style={shared.small}>{trip.stops.length} Orte · Details →</Text></View>
      </Pressable>)}
      {!visible.length && <EmptyState title={trips.length ? 'Keine Reise gefunden' : 'Deine erste Reise'} text={trips.length ? 'Versuche einen anderen Suchbegriff.' : 'Halte deinen ersten Reiseverlauf fest.'} action={<Button title="Reise erfassen" onPress={() => router.push('/create')} />} />}
      {trips.some((trip) => trip.id.startsWith('demo-')) && <Text style={styles.note}>Beispielreisen zur Vorschau · Du kannst sie bearbeiten oder loeschen.</Text>}
    </Screen>
  );
}
const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  intro: { fontSize: 16, color: '#657169', marginTop: 10, marginBottom: 24 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24, backgroundColor: 'white', borderWidth: 1, borderColor: colors.border },
  active: { backgroundColor: colors.dark, borderColor: colors.dark },
  count: { color: colors.muted, fontSize: 12, marginBottom: 12 },
  card: { padding: 22, backgroundColor: 'white', borderRadius: 24, marginBottom: 14, borderWidth: 1, borderColor: '#E8E9E1', gap: 12 },
  route: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EEF2EB', padding: 14, borderRadius: 15 },
  routeText: { color: '#53695B', fontWeight: '600', flex: 1, fontSize: 14 },
  title: { color: colors.text, fontSize: 23, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  badge: { backgroundColor: '#F1F0EB', color: '#59635C', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, fontSize: 12 },
  note: { textAlign: 'center', color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: 10 },
});
