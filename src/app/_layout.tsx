import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TripProvider, useTrips } from '../state/TripContext';
import { Button } from '../components/UI';
import { colors } from '../lib/theme';

function AppContent() {
  const { loading, error, reload } = useTrips();
  if (loading || error)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 20,
        }}
      >
        {loading ? (
          <>
            <ActivityIndicator color={colors.dark} />
            <Text>Deine Erinnerungen werden geladen …</Text>
          </>
        ) : (
          <>
            <Text>{error}</Text>
            <Button title="Erneut versuchen" onPress={() => void reload()} />
          </>
        )}
      </View>
    );
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <TripProvider>
        <AppContent />
      </TripProvider>
    </SafeAreaProvider>
  );
}
