import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AlertsProvider } from '../context/AlertsContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { FriendsProvider } from '../context/FriendsContext';
import { LocationProvider } from '../context/LocationContext';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { colors } from '../theme';

function RootNavigator() {
  const { ready, signedIn } = useAuth();
  const { loaded } = useSettings();

  if (!ready || !loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="alert/[id]" options={{ title: 'Alert details' }} />
        <Stack.Screen name="settings" options={{ title: 'Profile & settings' }} />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <LocationProvider>
          <AlertsProvider>
            <FriendsProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </FriendsProvider>
          </AlertsProvider>
        </LocationProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
