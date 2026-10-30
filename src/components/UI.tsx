import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ComponentProps, ReactNode } from 'react';
import { colors, shared } from '../lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export function Icon({
  name,
  size = 20,
  color = colors.text,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function showError(message: string) {
  if (Platform.OS === 'web') window.alert(message);
  else Alert.alert('Hinweis', message);
}

export function confirmDelete(message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
  } else
    Alert.alert('Wirklich löschen?', message, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: onConfirm },
    ]);
}

export function Screen({
  children,
  tab,
  scroll = true,
}: {
  children: ReactNode;
  tab?: 'trips' | 'map' | 'new';
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.content,
              { paddingBottom: tab ? 120 + insets.bottom : 30 + insets.bottom },
            ]}
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.content,
              styles.flex,
              { paddingBottom: tab ? 105 + insets.bottom : 20 },
            ]}
          >
            {children}
          </View>
        )}
        {tab && <BottomNav active={tab} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function BottomNav({ active }: { active: 'trips' | 'map' | 'new' }) {
  const insets = useSafeAreaInsets();
  const items = [
    { key: 'trips', title: 'Reisen', icon: 'grid' as const, path: '/' as const },
    {
      key: 'map',
      title: 'Karte',
      icon: 'ellipse-outline' as const,
      path: '/map' as const,
    },
    {
      key: 'new',
      title: 'Neu',
      icon: 'ellipse-outline' as const,
      path: '/create' as const,
    },
  ];
  return (
    <View
      style={[styles.navOuter, { bottom: Math.max(insets.bottom, 14) }]}
      pointerEvents="box-none"
    >
      <View style={styles.nav}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={item.title}
            accessibilityState={{ selected: active === item.key }}
            onPress={() => router.replace(item.path)}
            style={[styles.navItem, active === item.key && styles.navActive]}
          >
            <Icon name={item.icon} color="white" size={17} />
            <Text style={styles.navText}>{item.title}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function Button({
  title,
  onPress,
  loading,
  secondary,
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  secondary?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.text : 'white'} />
      ) : (
        <Text style={[styles.buttonText, secondary && { color: colors.text }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function BackHeader({ title, action }: { title?: string; action?: ReactNode }) {
  return (
    <View style={styles.backHeader}>
      <Pressable
        accessibilityRole="button"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.back}
      >
        <Icon name="arrow-back" size={15} />
        <Text style={styles.backText}>Zurück</Text>
      </Pressable>
      {title && <Text style={styles.headerTitle}>{title}</Text>}
      {action}
    </View>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Icon name="map-outline" size={36} color={colors.green} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={[shared.small, { textAlign: 'center' }]}>{text}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 22,
    paddingTop: 18,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  navOuter: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  nav: {
    flexDirection: 'row',
    padding: 7,
    borderRadius: 36,
    backgroundColor: '#263039',
    width: '86%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 43,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navActive: { backgroundColor: '#23252D', borderColor: '#D1D3D5' },
  navText: { fontSize: 13, color: 'white', fontWeight: '500' },
  button: {
    backgroundColor: colors.dark,
    borderRadius: 30,
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  secondary: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.border },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 22,
  },
  back: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 12,
    minHeight: 38,
  },
  backText: { fontSize: 12, fontWeight: '600', color: colors.text },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  empty: {
    padding: 25,
    marginTop: 25,
    gap: 15,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 24,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
});
