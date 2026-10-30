import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Button, EmptyState, Icon } from '../components/UI';
import TripMap from '../components/TripMap';
import { useTrips } from '../state/TripContext';
import { colors, shared } from '../lib/theme';
import { displayDate, tripPhotos } from '../lib/trip-utils';
import { photoSource } from '../lib/photos';

export default function MapScreen() {
  const { trips } = useTrips();
  const [selected, setSelected] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [mapHeight, setMapHeight] = useState(500);
  const options = trips.flatMap((trip) => trip.stops.map((stop) => ({ trip, stop })));
  const current = options.find((item) => item.stop.id === selected) ?? options[0];
  const selectedTrip = trips.find((trip) => trip.id === tripId);
  const shown = selectedTrip ? selectedTrip.stops : options.map((item) => item.stop);
  const photo = current
    ? tripPhotos({ ...current.trip, stops: [current.stop] })[0]
    : undefined;
  return (
    <Screen tab="map" scroll={false}>
      <View style={styles.heading}>
        <View>
          <Text style={shared.eyebrow}>ENTDECKTE ORTE</Text>
          <Text style={shared.title}>Reisekarte</Text>
        </View>
        <View style={styles.count}>
          <Text style={styles.countText}>● {shown.length} Orte</Text>
        </View>
      </View>
      {!options.length ? (
        <EmptyState
          title="Noch keine Orte"
          text="Erstelle zuerst eine Reise mit Standorten."
          action={
            <Button title="Reise erfassen" onPress={() => router.push('/create')} />
          }
        />
      ) : (
        <>
          <View style={styles.tripFilter}>
            {[
              { id: null, title: 'Alle' },
              ...trips.map((trip) => ({ id: trip.id, title: trip.title })),
            ].map((item) => (
              <Pressable
                accessibilityRole="button"
                key={item.id ?? 'all'}
                onPress={() => {
                  setTripId(item.id);
                  setSelected(
                    item.id
                      ? (trips.find((t) => t.id === item.id)?.stops[0]?.id ?? null)
                      : null,
                  );
                }}
                style={[styles.filter, tripId === item.id && styles.filterSelected]}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11,
                    color: tripId === item.id ? 'white' : colors.text,
                  }}
                >
                  {item.title}
                </Text>
              </Pressable>
            ))}
          </View>
          <View
            style={styles.mapArea}
            onLayout={(event) => setMapHeight(event.nativeEvent.layout.height)}
          >
            <TripMap
              stops={shown}
              selectedId={current?.stop.id}
              height={mapHeight}
              drawRoute={!!selectedTrip}
              onSelect={setSelected}
            />
            {current && (
              <View style={styles.preview}>
                {photo ? (
                  <Image source={photoSource(photo)} style={styles.previewImage} />
                ) : (
                  <View
                    style={[
                      styles.previewImage,
                      {
                        backgroundColor: '#E3E8E1',
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                    ]}
                  >
                    <Icon name="location-outline" size={30} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.date}>{displayDate(current.trip.startDate)}</Text>
                  <Text style={styles.location}>{current.stop.name}</Text>
                  <Text style={shared.small}>
                    {current.stop.entries.length} Einträge ·{' '}
                    {current.stop.entries.flatMap((e) => e.photos).length} Fotos
                  </Text>
                  <Button
                    title="Reise ansehen →"
                    onPress={() =>
                      router.push({
                        pathname: '/trip/[id]',
                        params: { id: current.trip.id, stopId: current.stop.id },
                      })
                    }
                    style={{ minHeight: 34, paddingVertical: 8, paddingHorizontal: 12 }}
                  />
                </View>
              </View>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  count: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE2D9',
    backgroundColor: '#EDF0E8',
  },
  countText: { fontSize: 10, color: '#4D6555', fontWeight: '600' },
  tripFilter: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  filter: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: 'white',
    maxWidth: 145,
  },
  filterSelected: { backgroundColor: colors.dark },
  mapArea: {
    flex: 1,
    minHeight: 260,
    overflow: 'hidden',
    borderRadius: 22,
    position: 'relative',
  },
  preview: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 14,
    borderRadius: 23,
    padding: 11,
    gap: 11,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    shadowColor: '#111',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  previewImage: { width: 82, height: 112, borderRadius: 15 },
  date: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAEDE7',
    color: '#526052',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
  },
  location: { fontSize: 18, fontWeight: '700', color: colors.text },
});
