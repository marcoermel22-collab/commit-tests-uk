import { StyleSheet } from 'react-native';

export const colors = {
  background: '#F8F7F3',
  surface: '#FFFFFF',
  text: '#1D2024',
  muted: '#8A8B96',
  border: '#E3E3E8',
  dark: '#252525',
  green: '#7D8981',
  light: '#F0EFEB',
};

export const shared = StyleSheet.create({
  label: {
    color: '#475062',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 15,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.text,
    minHeight: 49,
  },
  row: { flexDirection: 'row', gap: 12 },
  title: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -1,
    color: colors.text,
  },
  eyebrow: { fontSize: 11, fontWeight: '700', color: '#646B78', marginBottom: 3 },
  small: { fontSize: 12, color: colors.muted, lineHeight: 18 },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 16 },
});
