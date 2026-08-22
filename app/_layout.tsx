import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Loading } from 'melda-shared/ui/components';
import { useSession } from '../src/state/store';

// Root shell. Before rendering any route we hydrate the saved session (JWT) from
// storage and hand the token to the API client; until that resolves we hold a
// splash so a valid session never flashes the login screen. Auth-based routing
// lives in the routes themselves: `index` redirects in when a token exists, the
// `(student)` group redirects out when it doesn't.
export default function RootLayout() {
  const hydrated = useSession((s) => s.hydrated);
  const hydrate = useSession((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
    // Preload the two icon families the shared design system renders, so a slow
    // first paint never flashes blank icon glyphs (the low-bandwidth context).
    void Font.loadAsync({ ...Feather.font, ...Ionicons.font });
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {hydrated ? (
        <Stack screenOptions={{ headerShown: false }} />
      ) : (
        <Loading label="Loading MELDA" />
      )}
    </SafeAreaProvider>
  );
}
