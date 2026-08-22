import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {hydrated ? (
        <Stack screenOptions={{ headerShown: false, title: 'MELDA Student' }} />
      ) : (
        <Loading label="Loading MELDA" />
      )}
    </SafeAreaProvider>
  );
}
