import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { choosePhotos, photoSource } from '../lib/photos';
import { colors, shared } from '../lib/theme';
import { Icon, showError } from './UI';

export function PhotoButtons({ onAdd }: { onAdd: (uris: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  async function pick(camera: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      onAdd(await choosePhotos(camera));
    } catch (e) {
      showError(
        e instanceof Error ? e.message : 'Die Fotos konnten nicht geöffnet werden.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={shared.row}>
      {[
        {
          camera: true,
          title: 'Kamera',
          sub: 'Foto aufnehmen',
          icon: 'camera-outline' as const,
        },
        {
          camera: false,
          title: 'Galerie',
          sub: 'Auswählen',
          icon: 'images-outline' as const,
        },
      ].map((item) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.title}
          key={item.title}
          disabled={busy}
          style={[styles.photoButton, busy && { opacity: 0.5 }]}
          onPress={() => void pick(item.camera)}
        >
          <View style={styles.iconCircle}>
            <Icon name={item.icon} size={20} color="#2E3D36" />
          </View>
          <View>
            <Text style={styles.buttonTitle}>{item.title}</Text>
            <Text style={shared.small}>{item.sub}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export function PhotoGrid({
  photos,
  onRemove,
}: {
  photos: string[];
  onRemove?: (uri: string) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  if (!photos.length) return null;
  function thumbnail(uri: string, index: number, style?: object) {
    return (
      <View key={`${uri}-${index}`} style={[styles.photoWrap, style]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Foto ${index + 1} öffnen`}
          onPress={() => setSelected(index)}
          style={styles.fill}
        >
          <Image source={photoSource(uri)} style={styles.image} />
        </Pressable>
        {onRemove && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Foto ${index + 1} entfernen`}
            onPress={() => onRemove(uri)}
            style={styles.remove}
          >
            <Icon name="close" color="white" size={13} />
          </Pressable>
        )}
      </View>
    );
  }
  return (
    <>
      {!onRemove && photos.length > 1 ? (
        <>
          <View style={styles.mosaic}>
            {thumbnail(photos[0], 0, { width: '49%', height: 244 })}
            <View style={{ width: '48%', gap: 10 }}>
              {photos
                .slice(1, 3)
                .map((uri, index) =>
                  thumbnail(uri, index + 1, {
                    width: '100%',
                    height: photos.length > 2 ? 117 : 244,
                  }),
                )}
            </View>
          </View>
          {photos.length > 3 && (
            <View style={styles.grid}>
              {photos.slice(3).map((uri, index) => thumbnail(uri, index + 3))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.grid}>
          {photos.map((uri, index) => thumbnail(uri, index))}
        </View>
      )}
      <Modal
        visible={selected !== null}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <SafeAreaView style={styles.viewer}>
          <View style={styles.viewerHeader}>
            <Text style={{ color: 'white' }}>
              {selected === null ? '' : `${selected + 1} / ${photos.length}`}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Foto schliessen"
              onPress={() => setSelected(null)}
              style={{ padding: 12 }}
            >
              <Icon name="close" color="white" size={28} />
            </Pressable>
          </View>
          {selected !== null && photos[selected] && (
            <Image
              source={photoSource(photos[selected])}
              style={styles.fullPhoto}
              resizeMode="contain"
            />
          )}
          <View style={styles.viewerControls}>
            <Pressable
              accessibilityRole="button"
              disabled={selected === 0}
              onPress={() => setSelected((i) => Math.max(0, (i ?? 0) - 1))}
              style={{ padding: 20 }}
            >
              <Text style={{ color: 'white' }}>Vorheriges</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={selected === photos.length - 1}
              onPress={() =>
                setSelected((i) => Math.min(photos.length - 1, (i ?? 0) + 1))
              }
              style={{ padding: 20 }}
            >
              <Text style={{ color: 'white' }}>Nächstes</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    minHeight: 65,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'white',
    borderRadius: 21,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#95A099',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTitle: { fontSize: 14, color: colors.text, fontWeight: '700' },
  mosaic: { flexDirection: 'row', gap: 10, marginVertical: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 13 },
  photoWrap: { width: '47.9%', height: 124, borderRadius: 16, overflow: 'hidden' },
  firstPhoto: { height: 200 },
  fill: { flex: 1 },
  image: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#252A30',
    borderRadius: 15,
    padding: 6,
  },
  viewer: { flex: 1, backgroundColor: '#101112' },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  fullPhoto: { flex: 1, width: '100%' },
  viewerControls: { flexDirection: 'row', justifyContent: 'space-between' },
});
