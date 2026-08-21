import { Redirect, Stack } from 'expo-router';
import { useSession } from '../../src/state/store';
import { color, weight } from 'melda-shared/ui/tokens';

// The student EXPERIENCE stack. Guards the whole surface: no token -> back to the
// login screen. The (tabs) group (Home / Saved) owns its own tab-bar chrome, so it
// hides this header; the pushed detail screens (lesson, quiz) sit ABOVE the bar and
// get the styled native header with a back button, reachable from either tab.
export default function StudentStack() {
  const token = useSession((s) => s.token);
  if (!token) return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: color.appBg },
        headerShadowVisible: false,
        headerTintColor: color.accent,
        headerTitleStyle: { color: color.ink, fontWeight: weight.semibold },
        contentStyle: { backgroundColor: color.appBg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
