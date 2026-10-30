import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform, type ImageSourcePropType } from 'react-native';

const samples: Record<string, ImageSourcePropType> = {
  'sample:barcelona': require('../../assets/photos/barcelona.jpg'),
  'sample:paris': require('../../assets/photos/paris.jpg'),
  'sample:city': require('../../assets/photos/city.jpg'),
  'sample:paris-detail': require('../../assets/photos/paris-detail.jpg'),
};

export function photoSource(uri: string): ImageSourcePropType {
  return samples[uri] ?? { uri };
}

export async function choosePhotos(camera: boolean): Promise<string[]> {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted)
      throw new Error(
        'Die Kamera ist nicht freigegeben. Du kannst die Berechtigung in den Einstellungen ändern oder Fotos aus der Galerie wählen.',
      );
  }
  const result = camera
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
    : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: Platform.OS === 'web',
      });
  return result.canceled
    ? []
    : result.assets.map((asset) =>
        Platform.OS === 'web' && asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri,
      );
}

// Kamera/Galerie liefern temporäre Dateien. Erst beim Speichern dauerhaft kopieren.
export async function keepPhoto(uri: string): Promise<string> {
  if (uri.startsWith('sample:') || Platform.OS === 'web') return uri;
  const directory = new Directory(Paths.document, 'photos');
  directory.create({ idempotent: true, intermediates: true });
  if (uri.startsWith(directory.uri)) return uri;
  const source = new File(uri);
  const extension = source.extension || '.jpg';
  const destination = new File(
    directory,
    `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`,
  );
  try {
    await source.copy(destination);
  } catch (error) {
    if (destination.exists) destination.delete();
    throw error;
  }
  return destination.uri;
}

export function deletePhoto(uri: string) {
  if (uri.startsWith('sample:') || Platform.OS === 'web') return;
  const directory = new Directory(Paths.document, 'photos');
  if (!uri.startsWith(directory.uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Fotodatei konnte nicht entfernt werden:', error);
  }
}
