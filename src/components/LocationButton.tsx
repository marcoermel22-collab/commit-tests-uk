import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { getCurrentPlace } from '../lib/location';
import type { CurrentPlace } from '../lib/location-utils';
import { colors, shared } from '../lib/theme';
import { Icon } from './UI';

type Props = { onSelect: (place: CurrentPlace) => void; disabled?: boolean };

// Derselbe Standortbutton wird im Reiseformular und im Tagebucheintrag verwendet.
export default function LocationButton({ onSelect, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<CurrentPlace | null>(null);
  const [error, setError] = useState('');

  async function locate() {
    if (loading || disabled) return;
    setLoading(true);
    setError('');
    setSuggestion(null);
    try {
      setSuggestion(await getCurrentPlace());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Der Standort ist nicht verfügbar.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Aktuellen Standort verwenden"
        accessibilityState={{ disabled: loading || disabled, busy: loading }}
        disabled={loading || disabled}
        onPress={() => void locate()}
        style={[styles.button, (loading || disabled) && { opacity: 0.5 }]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Icon name="locate-outline" size={18} />
        )}
        <Text style={styles.buttonText}>
          {loading ? 'Standort wird gesucht …' : 'Aktuellen Standort verwenden'}
        </Text>
      </Pressable>
      {suggestion && (
        <View style={styles.suggestion}>
          <Text style={styles.buttonText}>Vorschlag: {suggestion.name}</Text>
          <Text style={shared.small}>
            {suggestion.latitude.toFixed(4)}, {suggestion.longitude.toFixed(4)}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => {
              // Noch nichts speichern: Erst die bestätigte Position ins Formular übernehmen.
              onSelect(suggestion);
              setSuggestion(null);
            }}
            style={styles.accept}
          >
            <Text style={styles.buttonText}>Standort übernehmen</Text>
          </Pressable>
        </View>
      )}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, gap: 8 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  buttonText: { fontSize: 12, fontWeight: '600', color: colors.text },
  suggestion: { padding: 14, gap: 6, borderRadius: 16, backgroundColor: colors.light },
  accept: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  error: { fontSize: 12, lineHeight: 18, color: '#8A3030' },
});
