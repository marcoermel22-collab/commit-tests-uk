import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, EmptyState, Screen } from '../components/UI';
import TripMap from '../components/TripMap';
import { useTrips } from '../state/TripContext';
import { shared } from '../lib/theme';

export default function MapScreen() {
  const { trips } = useTrips();
  const [selected, setSelected] = useState<string | null>(null);
  const trip = trips.find((item) => item.id === selected) ?? trips[0];
  return <Screen tab="map">
    <Text style={shared.eyebrow}>ORT FUER ORT</Text><Text style={shared.title}>Deine Reisekarte</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 20 }}>{trips.map((item) => <Pressable key={item.id} accessibilityRole="button" onPress={() => setSelected(item.id)} style={{ padding: 12, borderRadius: 20, backgroundColor: item.id === trip?.id ? '#DEE8D8' : 'white' }}><Text>{item.title}</Text></Pressable>)}</View>
    {trip ? <><TripMap stops={trip.stops} height={350} drawRoute /><Button title="Reisedetails oeffnen" onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } })} style={{ marginTop: 20 }} /></> : <EmptyState title="Noch keine Reise" text="Erfasse eine Reise mit Start und Ziel." />}
  </Screen>;
}
