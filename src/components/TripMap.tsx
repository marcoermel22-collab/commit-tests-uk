import { useNetworkState } from 'expo-network';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { colors } from '../lib/theme';
import type { TripMapProps } from './TripMap.types';

export default function TripMap({
  stops,
  selectedId,
  height = 190,
  editable,
  onSelect,
  onPick,
  drawRoute = true,
}: TripMapProps) {
  const map = useRef<MapView>(null);
  const network = useNetworkState();
  const failed = network.isConnected === false || network.isInternetReachable === false;
  const [ready, setReady] = useState(false);
  const coordinates = stops.map((stop) => ({
    latitude: stop.latitude,
    longitude: stop.longitude,
  }));
  const first = stops.find((stop) => stop.id === selectedId) ?? stops[0];
  const coordinatesKey = stops
    .map((stop) => `${stop.latitude},${stop.longitude}`)
    .join(';');
  useEffect(() => {
    if (!ready || !stops.length) return;
    if (stops.length > 1)
      map.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 45, right: 50, bottom: 45, left: 50 },
        animated: true,
      });
    else
      map.current?.animateToRegion({
        latitude: stops[0].latitude,
        longitude: stops[0].longitude,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      });
    // Die Kamera nur bei geänderten Koordinaten bewegen, nicht beim Tippen im Textfeld.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, coordinatesKey]);
  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: first?.latitude ?? 48.3,
          longitude: first?.longitude ?? 5,
          latitudeDelta: stops.length > 1 ? 18 : 0.15,
          longitudeDelta: stops.length > 1 ? 18 : 0.15,
        }}
        onMapReady={() => setReady(true)}
        onPress={(event) => {
          if (editable)
            onPick?.(
              event.nativeEvent.coordinate.latitude,
              event.nativeEvent.coordinate.longitude,
            );
        }}
      >
        {drawRoute && stops.length > 1 && (
          <Polyline
            coordinates={coordinates}
            strokeColor="#7D8981"
            strokeWidth={3}
            lineDashPattern={[6, 5]}
          />
        )}
        {stops.map((stop, index) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={stop.name || 'Standort'}
            onPress={(event) => {
              event.stopPropagation();
              onSelect?.(stop.id);
            }}
          >
            <View style={[styles.marker, stop.id === selectedId && styles.selected]}>
              <Text style={styles.number}>{stops.length > 1 ? index + 1 : '●'}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
      {failed && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Die Karte ist momentan nicht verfügbar. Gespeicherte Texte und Fotos bleiben
            zugänglich.
          </Text>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D7DCD7',
    backgroundColor: '#EDF0E9',
  },
  marker: {
    backgroundColor: colors.dark,
    borderWidth: 3,
    borderColor: 'white',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: '#657B69' },
  number: { color: 'white', fontSize: 12, fontWeight: '700' },
  notice: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#EDF0E9',
    justifyContent: 'center',
    padding: 20,
  },
  noticeText: { fontSize: 13, textAlign: 'center', color: '#4E5D51' },
});
