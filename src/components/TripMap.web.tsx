import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { TripMapProps } from './TripMap.types';

// Browser-Vorschau mit OSM-Kacheln. Auf dem Handy verwendet Metro TripMap.tsx.
// Mercator-Projektion: Koordinaten in Bildpunkte umrechnen und beim Tippen zurück.
function project(lat: number, lon: number, zoom: number) {
  const size = 256 * 2 ** zoom;
  const clamped = Math.max(-85, Math.min(85, lat));
  const sin = Math.sin((clamped * Math.PI) / 180);
  return {
    x: ((lon + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  };
}

export default function TripMap({
  stops,
  selectedId,
  height = 190,
  editable,
  onSelect,
  onPick,
  drawRoute = true,
}: TripMapProps) {
  const [width, setWidth] = useState(340);
  const [failed, setFailed] = useState(false);
  const points = stops.map((stop) => project(stop.latitude, stop.longitude, 0));
  // Die tatsächliche Spannweite benutzen, damit nahe Standorte getrennt sichtbar sind.
  const dx =
    points.length > 1
      ? Math.max(
          0.001,
          Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x)),
        )
      : 1;
  const dy =
    points.length > 1
      ? Math.max(
          0.001,
          Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y)),
        )
      : 1;
  const zoom =
    stops.length > 1
      ? Math.max(
          2,
          Math.min(
            12,
            Math.floor(
              Math.log2(
                Math.min(Math.max(80, width - 80) / dx, Math.max(60, height - 70) / dy),
              ),
            ),
          ),
        )
      : 8;
  const lat = stops.length
    ? stops.reduce((sum, s) => sum + s.latitude, 0) / stops.length
    : 48.3;
  const lon = stops.length
    ? stops.reduce((sum, s) => sum + s.longitude, 0) / stops.length
    : 5;
  const center = project(lat, lon, zoom);
  const left = center.x - width / 2,
    top = center.y - height / 2;
  const tiles = [];
  for (let x = Math.floor(left / 256); x <= Math.floor((left + width) / 256); x++) {
    for (let y = Math.floor(top / 256); y <= Math.floor((top + height) / 256); y++) {
      if (y >= 0 && y < 2 ** zoom) tiles.push({ x, y });
    }
  }
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.map, { height }]}
    >
      <Pressable
        accessibilityRole="button"
        style={StyleSheet.absoluteFill}
        accessibilityLabel={editable ? 'Standort auf der Karte auswählen' : 'Reisekarte'}
        onPress={(e) => {
          if (!editable) return;
          const size = 256 * 2 ** zoom;
          const x = left + e.nativeEvent.locationX,
            y = top + e.nativeEvent.locationY;
          onPick?.(
            (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / size))) * 180) / Math.PI,
            (x / size) * 360 - 180,
          );
        }}
      >
        {tiles.map((tile) => (
          <Image
            key={`${tile.x}-${tile.y}`}
            pointerEvents="none"
            onError={() => setFailed(true)}
            source={{
              uri: `https://tile.openstreetmap.org/${zoom}/${(tile.x + 2 ** zoom) % 2 ** zoom}/${tile.y}.png`,
            }}
            style={{
              position: 'absolute',
              width: 256,
              height: 256,
              left: tile.x * 256 - left,
              top: tile.y * 256 - top,
            }}
          />
        ))}
      </Pressable>
      {drawRoute &&
        stops.slice(1).map((stop, i) => {
          const a = project(stops[i].latitude, stops[i].longitude, zoom);
          const b = project(stop.latitude, stop.longitude, zoom);
          const distance = Math.hypot(b.x - a.x, b.y - a.y);
          const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
          return (
            <View
              key={`line-${stop.id}`}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: a.x - left,
                top: a.y - top,
                height: 2,
                width: distance,
                backgroundColor: '#7D8981',
                transformOrigin: 'left center',
                transform: [{ rotate: `${angle}deg` }],
              }}
            />
          );
        })}
      {stops.map((stop, i) => {
        const point = project(stop.latitude, stop.longitude, zoom);
        return (
          <Pressable
            accessibilityRole="button"
            key={stop.id}
            accessibilityLabel={`Standort ${i + 1}: ${stop.name}`}
            onPress={() => onSelect?.(stop.id)}
            style={[
              styles.marker,
              {
                left: point.x - left - 13,
                top: point.y - top - 13,
                backgroundColor: stop.id === selectedId ? '#657B69' : '#252525',
              },
            ]}
          >
            <Text style={styles.number}>{i + 1}</Text>
          </Pressable>
        );
      })}
      {failed && (
        <View pointerEvents="none" style={styles.notice}>
          <Text>Karte nicht verfügbar. Standortwahl bleibt möglich.</Text>
        </View>
      )}
      <Text pointerEvents="none" style={styles.credit}>
        © OpenStreetMap contributors
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  map: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#EDF0E9',
    borderWidth: 1,
    borderColor: '#D7DCD7',
  },
  marker: {
    position: 'absolute',
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: { color: 'white', fontWeight: '700', fontSize: 11 },
  credit: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    fontSize: 9,
    backgroundColor: 'white',
  },
  notice: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
  },
});
