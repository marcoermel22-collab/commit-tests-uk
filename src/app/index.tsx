import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Screen, Icon, EmptyState, Button } from '../components/UI';
import { useTrips } from '../state/TripContext';
import { colors, shared } from '../lib/theme';
import { displayDate, filterTrips, tripPhotos } from '../lib/trip-utils';
import { photoSource } from '../lib/photos';
import type { Trip } from '../types/trip';

export default function TripsScreen() {
  const { trips } = useTrips();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Alle');
  const filters = useMemo(
    () => [
      'Alle',
      ...Array.from(new Set(trips.map((t) => t.startDate.slice(0, 4))))
        .sort()
        .reverse(),
      ...Array.from(new Set(trips.map((t) => t.tag).filter(Boolean))),
    ],
    [trips],
  );
  const visible = filterTrips(trips, query, filter).sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  );
  function card(trip: Trip, large: boolean) {
    const photo = tripPhotos(trip)[0];
    const text = trip.stops.flatMap((stop) => stop.entries)[0]?.text;
    return (
      <Pressable
        key={trip.id}
        accessibilityRole="button"
        accessibilityLabel={`Reise öffnen: ${trip.title}`}
        onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } })}
        style={[styles.card, large ? styles.featured : styles.smallCard]}
      >
        {photo ? (
          <Image
            source={photoSource(photo)}
            style={large ? styles.heroImage : styles.smallImage}
          />
        ) : (
          <View style={[large ? styles.heroImage : styles.smallImage, styles.noPhoto]}>
            <Icon name="image-outline" size={36} color={colors.green} />
          </View>
        )}
        <View style={[shared.row, { alignItems: 'baseline', marginTop: 9, gap: 6 }]}>
          <Text numberOfLines={2} style={[styles.tripTitle, !large && { fontSize: 14 }]}>
            {trip.title}
          </Text>
          {large && <Text style={styles.date}>{displayDate(trip.startDate)}</Text>}
        </View>
        {text && (
          <Text numberOfLines={large ? 1 : 2} style={styles.description}>
            {text}
          </Text>
        )}
        {large ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {trip.tag || `${trip.stops.length} Standorte`}
            </Text>
          </View>
        ) : (
          <Text style={styles.date}>{displayDate(trip.startDate)}</Text>
        )}
      </Pressable>
    );
  }
  return (
    <Screen tab="trips">
      <View style={styles.heading}>
        <View>
          <Text style={shared.eyebrow}>MEINE ERINNERUNGEN</Text>
          <Text style={shared.title}>Pin Map</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/create')}
          style={styles.add}
        >
          <Text style={styles.addText}>+ Erfassen</Text>
        </Pressable>
      </View>
      <View style={styles.search}>
        <Icon name="search-outline" size={19} color={colors.muted} />
        <TextInput
          accessibilityLabel="Reisen durchsuchen"
          value={query}
          onChangeText={setQuery}
          placeholder="Orte, Reisen oder Notizen suchen…"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 13, marginBottom: 17 }}
        contentContainerStyle={styles.filters}
      >
        {filters.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item }}
            onPress={() => setFilter(item)}
            style={[styles.filter, filter === item && styles.activeFilter]}
          >
            <Text style={[styles.filterText, filter === item && { color: 'white' }]}>
              {item === 'Alle' ? `Alle (${trips.length})` : item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {visible[0] && card(visible[0], true)}
      <View style={styles.smallCards}>
        {visible.slice(1).map((trip) => card(trip, false))}
      </View>
      {!visible.length && (
        <EmptyState
          title={trips.length ? 'Keine Reise gefunden' : 'Deine erste Erinnerung'}
          text={
            trips.length
              ? 'Versuche einen anderen Suchbegriff oder Filter.'
              : 'Erfasse eine Reise und halte deine Erlebnisse fest.'
          }
          action={
            !trips.length ? (
              <Button title="Reise erfassen" onPress={() => router.push('/create')} />
            ) : undefined
          }
        />
      )}
      {trips.some((trip) => trip.id.startsWith('demo-')) && (
        <Text
          style={[shared.small, { marginTop: 16, textAlign: 'center', fontSize: 10 }]}
        >
          Beispielreisen zur Vorschau · Du kannst sie bearbeiten oder löschen.
        </Text>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  add: {
    backgroundColor: '#191A1C',
    paddingVertical: 12,
    paddingHorizontal: 17,
    borderRadius: 25,
  },
  addText: { color: 'white', fontSize: 12, fontWeight: '600' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEEDE9',
    borderRadius: 25,
    paddingHorizontal: 14,
    height: 45,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 13, minWidth: 0, height: '100%' },
  filters: { flexDirection: 'row', gap: 7 },
  filter: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeFilter: { backgroundColor: '#191A1C', borderColor: '#191A1C' },
  filterText: { fontSize: 11, color: '#4F5560' },
  card: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 8,
    shadowColor: '#343631',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  featured: { width: '100%', paddingBottom: 13 },
  smallCard: { width: '47.9%', paddingBottom: 15 },
  heroImage: {
    width: '100%',
    height: 171,
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  smallImage: { width: '100%', height: 132, borderRadius: 17 },
  tripTitle: {
    flex: 1,
    color: '#17191C',
    fontSize: 17,
    fontWeight: '700',
    paddingLeft: 5,
  },
  date: { color: '#A0A2AD', fontSize: 10, marginTop: 7, marginHorizontal: 5 },
  description: {
    color: '#90919C',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginHorizontal: 5,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.green,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 7,
    marginLeft: 5,
  },
  tagText: { color: 'white', fontSize: 10, fontWeight: '600' },
  smallCards: { flexDirection: 'row', flexWrap: 'wrap', gap: 13, marginTop: 15 },
  noPhoto: { backgroundColor: '#EAEDE7', alignItems: 'center', justifyContent: 'center' },
});
