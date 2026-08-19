import { Redirect, Stack } from 'expo-router';
import { useSession } from '../../src/state/store';
import { color, weight } from '../../src/ui/tokens';

// The student EXPERIENCE stack. Guards the whole surface: no token -> back to the
// login screen. A styled native header gives pushed screens (lesson, quiz) a back
// button; the home screen hides it and renders its own via <Screen>.
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
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
